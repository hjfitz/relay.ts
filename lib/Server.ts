import http from 'http';
import https from 'https';
import { parse } from 'url';
import debug from 'debug';

import Request from './Request';
import Response from './Response';
import { noop } from './util';

const d = debug('server:Server');

export interface VerbMiddleware {
  [key: string]: FunctionConstructor;
}

export interface Middleware {
  func: Function;
  idx: Number;
}

export interface IRequest {
  url: string | undefined;
  headers: http.IncomingHttpHeaders;
  method?: string;
  code: number | undefined;
  query: string | null;
  pathname?: string; 
  payload?: object;
  urlMws: Middleware[];
}

export interface ServerMiddleware {
  [key: string]: Function | Object;
  GET: VerbMiddleware | Object;
  POST: VerbMiddleware | Object;
  PUT: VerbMiddleware | Object;
  PATCH: VerbMiddleware | Object;
  DELETE: VerbMiddleware | Object;
}

interface ServerResponse {
  json: Promise<{}>;
  send: Promise<Function>;
  sendFile: Promise<Function>;
  sendStatus: Function;
  end: Function;
}

class Server {

  _server: https.Server | http.Server;
  mwCount: number;
  middleware: any;
  port: number;
  all: Function;
  get: Function; 
  head: Function;
  patch: Function ;
  options: Function; 
  connect: Function;
  delete: Function;
  trace: Function;
  post: Function;
  put: Function;
  use: Function;

  constructor(port: number, useSSL: boolean = false, cert?: string, key?: string) {
    this.mwCount = 0;
    this.listener = this.listener.bind(this);
    this.port = port;
    // instantiate a http(s) server
    this._server = http.createServer(this.listener);
    if (useSSL) this._server = https.createServer({ key, cert }, this.listener);
    
    // this.middleware = { GET: {}, POST: {}, PUT: {}, PATCH: {}, DELETE: {} };
    this.middleware = {};

    this.all = this.add.bind(this, '*');
    this.use = this.add.bind(this, '*');
    this.get = this.add.bind(this, 'GET');
    this.head = this.add.bind(this, 'HEAD');
    this.patch = this.add.bind(this, 'PATCH');
    this.options = this.add.bind(this, 'OPTIONS');
    this.connect = this.add.bind(this, 'CONNECT');
    this.delete = this.add.bind(this, 'DELETE');
    this.trace = this.add.bind(this, 'TRACE');
    this.post = this.add.bind(this, 'POST');
    this.put = this.add.bind(this, 'PUT');
  }

  listener(req: http.IncomingMessage, res: http.ServerResponse): void {
    d('connection to server made');
    // firstly, parse the request and response - make it a little more express-like
    this.parseRequest(req).then((parsedReq: Request) => {
      const { method, pathname } = parsedReq;
          // default to GET if no method
      const mws = this.middleware[method || 'GET'];
      const urlMws = mws[pathname || '*'];

      console.log({ urlMws });
      d('Response and request parsed');
      const parsedRes: Response = new Response(res, parsedReq, urlMws);
      // go through each middleware, check and fire off
      // eventualy add a queue
      this.handleRequest(parsedReq, parsedRes);
    });
  }
  
  // todo: add stack to req
  parseRequest(req: http.IncomingMessage): Promise<Request> {

      // need to parse to METHOD & path at minimum
    req.on('close', () => console.log('//todo')); // to remove from queue

      // get what we're interested from the pure request
    const { url, headers, method, statusCode: code } = req;
    const { query, pathname } = parse(url || '');
    d('url parsed: ', pathname);

    // default to GET if no method
    const mws = this.middleware[method || 'GET'];
    const urlMws = mws[pathname || '*'];

    // console.log({ urlMws });


      // create request object
    const requestOpts: IRequest = { url, headers, method, code, query, pathname, urlMws };
    const parsedRequest = new Request(requestOpts, req);

      // attempt to parse incoming data
    const contentType = headers['content-type'];
    d(`content type: ${contentType}`);
    if (!('content-type' in headers)) return Promise.resolve(parsedRequest);

      // handleIncomingStream returns itself - resolve after handling
    return parsedRequest.handleIncomingStream(contentType);
  }


  /**
   * @param cb Callback function to run when server is running
   */
  init(cb?: Function): Server {
    this.prepareMiddleware();
    this._server.listen(this.port, () => {
      if (cb) cb();
    });
    return this;
  }

  /**
   * go through each middleware, and add a next(), pointing to next function on that verb
   * doing this on init means that lookups are o(1)
   */
  prepareMiddleware(): void {
    d('preparing midleware');
    const all = this.middleware['*'];

    // apply all '*' to each method
    // todo: do this for every possible verb
    // go through each verb
    Object.keys(this.middleware).forEach((verb: string) => {
      if (verb === '*') return;
      const middlewares = this.middleware[verb];
      // go through each url on the middleware 
      Object.keys(all).forEach((url: string) => {
        if (url in middlewares) middlewares[url].push(...all[url]);
        else middlewares[url] = [...all[url]];
      });
    }); 
    // d('parsed round 1', this.middleware);
    d('verbs handled');

    // append wildcards to each url
    Object.keys(this.middleware).forEach((verb: string) => {
      const mwStack = this.middleware[verb];
      const wildcard = mwStack['*'];
      Object.keys(mwStack).forEach((url: string) => {
        if (url === '*') return;
        let curStack = mwStack[url];
        if (wildcard) curStack.push(...wildcard);
        curStack = curStack.sort((mw1: Middleware, mw2: Middleware) => {
          if (mw1.idx < mw2.idx) return -1;
          if (mw1.idx > mw2.idx) return 1;
          return 0;
        });
      });
    });
    d('wildcards handled');
    // d('parsed round 2', this.middleware);
    d('middleware prepped');
  }

  // todo: figure out how to do next() properly
  handleRequest(req: Request, res: Response): void {
    const { method, url }: { method: string | undefined, url: string | undefined } = req;
    
    d(`method: ${method}, url: ${url}`);
    
    // this should never happen
    if (!method || !url) return res.send('no method!');

    const middlewares: Middleware[] = this.middleware[method][url];
    // nothing? let the user know, and close the connection
    if (!middlewares) return res.send(`unable to ${method} on ${url}!`);
    
    const middleware: Middleware = middlewares[0];

    // invoke the middleware!
    middleware.func(req, res, res.getNext());
  }

  private add(method: string, url: string|Function, middleware?: Function): Server {
    if (typeof url === 'string' && middleware) return this.addMw(method, url, middleware);
    if (url instanceof Function) return this.addMw(method, '*', url);
    throw new Error('should not get here');
  }
  
  private addMw(method: string, url: string, middleware: Function): Server {
    const newWare = { func: middleware, idx: this.mwCount };
    
    if (! (method in this.middleware)) this.middleware[method] = {};
    if (!(url in this.middleware[method])) this.middleware[method][url] = [newWare];
    else this.middleware[method][url].push(newWare);
    
    d(`${method} middleware for ${url} added`);
    this.mwCount += 1;

    return this;
  }
}

export default Server;

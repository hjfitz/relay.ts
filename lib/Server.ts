import http from 'http';
import https from 'https';
import { parse } from 'url';
import debug from 'debug';

import Request from './Request';
import Response from './Response';

const d = debug('relay:Server');

export interface Middleware {
  func: Function;
  idx: Number;
}

class Server {
  private mwCount: number;
  private _server: https.Server | http.Server;
  private middleware: any;
  private port: number;
  all: Function;
  get: Function; 
  head: Function;
  patch: Function ;
  options: Function; 
  delete: Function;
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
        
    this.middleware = { GET: {}, HEAD: {}, OPTIONS: {}, POST: {}, PUT: {}, PATCH: {}, DELETE: {} };

    this.all = this.add.bind(this, '*');
    this.use = this.add.bind(this, '*');
    this.get = this.add.bind(this, 'GET');
    this.head = this.add.bind(this, 'HEAD');
    this.patch = this.add.bind(this, 'PATCH');
    this.options = this.add.bind(this, 'OPTIONS');
    this.delete = this.add.bind(this, 'DELETE');
    this.post = this.add.bind(this, 'POST');
    this.put = this.add.bind(this, 'PUT');
  }

    /**
   * @param cb Callback function to run when server is running
   */
  init(cb?: Function): Promise<Server> {
    this.prepareMiddleware();
    return new Promise((resolve: Function) => {
      this._server.listen(this.port, () => {
        if (cb) cb();
        resolve(this);
      });
    });
  }

  private listener(req: http.IncomingMessage, res: http.ServerResponse): void {
    d('===BEGINNING PARSE===')
    // firstly, parse the request and response - make it a little more express-like
    this.parseRequest(req).then((parsedReq: Request) => {
      const { method, url } = parsedReq;
      // default to GET if no method
      const mws = this.middleware[method || 'GET'];
      const urlMws = [...mws[url || '*'] || mws['*']];

      d(`queue size for ${url}: ${urlMws.length}`);

      // first funciton is used immediately
      const { func }: {func: Function} = urlMws.shift();

      const parsedRes: Response = new Response(res, parsedReq, urlMws);
      d('Request and Response parsed');
      
      func(parsedReq, parsedRes, parsedRes.getNext);
      d('===END PARSE===');
    });
  }
  
  // todo: add stack to req
  private parseRequest(req: http.IncomingMessage): Promise<Request> {
    // need to parse to METHOD & path at minimum
    // req.on('close', () => console.log('//todo'));

    // get what we're interested from the pure request
    const { url, headers, method, statusCode } = req;
    const { query } = parse(url || '');

    d('beginning request parse');
    // create request object
    const parsedRequest = new Request({ 
      statusCode, 
      headers, 
      method, 
      query, 
      req,
      url, 
    });

    // attempt to parse incoming data
    const contentType = headers['content-type'];
    d(`content type: ${contentType}`);
    if (!('content-type' in headers)) return Promise.resolve(parsedRequest);

    d('parsing incoming stream...');
    // handleIncomingStream returns itself - resolve after handling
    return parsedRequest.handleIncomingStream(contentType);
  }

  /**
   * clean this the fuck up
   */
  private prepareMiddleware(): void {
    d('preparing midleware');
    const all = this.middleware['*'];

    // apply all '*' to each method
    // go through each verb we currently have
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
    d('middleware prepped');
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

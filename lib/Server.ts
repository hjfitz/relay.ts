import http from 'http';
import https from 'https';
import { parse } from 'url';
import queryString from 'querystring';
import debug from 'debug';
import fs from 'fs';

import Request, { IRequest } from './Request';
import Response from './Response';
import { noop } from './util';

const d = debug('server:Server');

interface VerbMiddleware {
  [key: string]: FunctionConstructor,
}

interface Middleware {
  func: Function,
  next: Function,
}

interface ServerMiddleware {
  pure: any[],
  [key: string]: Function | Object,
  GET: VerbMiddleware | Object,
  POST: VerbMiddleware | Object,
  PUT: VerbMiddleware | Object,
  PATCH: VerbMiddleware | Object,
  DELETE: VerbMiddleware | Object
}

interface ServerResponse {
  json: Promise<{}>,
  send: Promise<Function>,
  sendFile: Promise<Function>,
  sendStatus: Function,
  end: Function
}

export default class Server {

  _server: https.Server | http.Server;
  middleware: ServerMiddleware;
  port: number;

  constructor(port: number, useSSL: boolean = false, cert?: string, key?: string) {
    this.listener = this.listener.bind(this);
    this.port = port;
    this._server = http.createServer(this.listener);
    if (useSSL) {
      this._server = https.createServer({ key, cert }, this.listener);
    }

    this.middleware = {
      pure: [],
      GET: {},
      POST: {},
      PUT: {},
      PATCH: {},
      DELETE: {},
    };
  }

  listener(req: http.IncomingMessage, res: http.ServerResponse): void {
    d('connection to server made');
    // firstly, parse the request and response - make it a little more express-like
    const parsedRes = new Response(res);
    // go through each middleware, check and fire off
    // eventualy add a queue
    Server.parseRequest(req).then((parsedReq: Request) => {
      d('Response and request parsed');
      this.handleRequest(parsedReq, parsedRes);
    });
  }

  static parseRequest(req: http.IncomingMessage): Promise<Request> {
    return new Promise((res) => {

      // need to parse to METHOD & path at minimum
      req.on('close', () => console.log('//todo')); // to remove from queue

      // get what we're interested from the pure request
      const { url, headers, method, statusCode: code } = req;
      const { query, pathname } = parse(url || '');

      // create request object
      const requestOpts: IRequest = { url, headers, method, code, query, pathname };
      const parsedRequest = new Request(requestOpts, req);

      // attempt to parse incoming data
      const contentType = headers['content-type'];
      d(`content type: ${contentType}`);
      if (!('content-type' in headers)) return res(parsedRequest);

      // handleIncomingStream returns itself - resolve after handling
      parsedRequest.handleIncomingStream(contentType).then(res);
    });
  }


  /**
   * @param cb Callback function to run when server is running
   */
  init(cb: Function): Server {
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
    ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach((verb) => {
      const middlewares: string[] = Object.keys(this.middleware[verb]);
      d(`middleware for ${verb}: ${middlewares}`);
      for (let i = 0; i < middlewares.length; i += 1) {
        const cur: object = this.middleware[verb]; // current set of middleware
        const idx: string = middlewares[i]; // current index
        const func: Function = cur[idx];
        const next: Function = cur[middlewares[i + 1]];
        cur[idx] = { func, next };
        if (!next) { 
          cur[idx] = { func, next: noop };
        } 
      }
    });
  }

  // todo: figure out how to do next() properly
  handleRequest(req: Request, res: Response): void {
    const { method, url }: { method: string | undefined, url: string | undefined } = req;
    
    d(`method: ${method}, url: ${url}`);
    
    // this should never happen
    if (!method || !url) return res.send('no method!');
    
    const pureMiddleware: Middleware[] = this.middleware.pure.filter(
      ware => ware.url === '*' || ware.url === url,
    );

    const middleware: Middleware = this.middleware[method][url];

    // nothing? let the user know, and close the connection
    if (!middleware) return res.send(`unable to ${method} on ${url}!`);

    // invoke the middleware!
    middleware.func(req, res, () => middleware.next(req, res));
  }

  static(path: string): Server {
    return this;
  }


  use(urlOrMiddleware: string | Function, middleware?: Function): Server {
    d('pure middleware added');
    // todo: figure out an efficient way to parse this
    const pure = { func: middleware, url: urlOrMiddleware };
    if (typeof urlOrMiddleware !== 'string') {
      pure.func = urlOrMiddleware;
      pure.url = '*';
    }
    this.middleware.pure.push(pure);
    return this;
  }

  get(url: string, middleware: Function): Server {
    d(`GET middleware for ${url} added`);
    this.middleware.GET[url] = middleware;
    return this;
  }

  put(url: string, middleware: Function): Server {
    d(`PUT middleware for ${url} added`);
    this.middleware.PUT[url] = middleware;
    return this;  
  }

  post(url: string, middleware: Function): Server {
    d(`POST middleware for ${url} added`);
    this.middleware.POST[url] = middleware;
    return this; 
  }

  patch(url: string, middleware: Function): Server {
    d(`PATCH middleware for ${url} added`);
    this.middleware.PATCH[url] = middleware;
    return this;
  }

  delete(url: string, middleware: Function): Server {
    d(`DELETE middleware for ${url} added`);
    this.middleware.DELETE[url] = middleware;
    return this;
  }
}

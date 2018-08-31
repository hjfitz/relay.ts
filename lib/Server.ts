import http from 'http';
import https from 'https';
import { parse } from 'url';
import querystring from 'querystring';
import debug from 'debug';
import fs from 'fs';

import Request, { IRequest } from './Request';
import Response from './Response';
import { noop } from './util';
import { isFunction } from 'util';
import { url } from 'inspector';

const d = debug('server:Server');

export interface VerbMiddleware {
  [key: string]: FunctionConstructor;
}

interface Middleware {
  func: Function;
  next: Function;
  idx: Number;
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

export default class Server {

  _server: https.Server | http.Server;
  middleware: ServerMiddleware;
  port: number;
  waiting: ServerMiddleware[];

  constructor(port: number, useSSL: boolean = false, cert?: string, key?: string) {
    this.listener = this.listener.bind(this);
    this.port = port;

    // instantiate a http(s) server
    this._server = http.createServer(this.listener);
    if (useSSL) this._server = https.createServer({ key, cert }, this.listener);
    
    this.waiting = [];

    this.middleware = { GET: {}, POST: {}, PUT: {}, PATCH: {}, DELETE: {} };
  }

  listener(req: http.IncomingMessage, res: http.ServerResponse): void {
    d('connection to server made');
    // firstly, parse the request and response - make it a little more express-like
    Server.parseRequest(req).then((parsedReq: Request) => {
      d('Response and request parsed');
      const parsedRes: Response = new Response(res);
      // go through each middleware, check and fire off
      // eventualy add a queue
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
      d(parse(url || ''));

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
    // this.prepareMiddleware();
    this._server.listen(this.port, () => {
      if (cb) cb();
    });
    return this;
  }

  prepareMiddlewareNew(): void {
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
        
        // by giving each middleware an index, 
        // we can check to ensure that pure middleware isn't invoked 
        // where is isn't meant to be
        cur[idx] = { func, next, idx: i };
        if (!next) cur[idx] = { func, next: noop, idx: i };
        d('Set middleware for', verb, 'as', cur[idx]);
      }
    });
  }

  // todo: figure out how to do next() properly
  handleRequest(req: Request, res: Response): void {
    const { method, url }: { method: string | undefined, url: string | undefined } = req;
    
    d(`method: ${method}, url: ${url}`);
    
    // this should never happen
    if (!method || !url) return res.send('no method!');

    const middlewares: Middleware[] = this.middleware[method][url];
    console.log(middlewares);
    const middleware: Middleware = middlewares[0];
    
    // nothing? let the user know, and close the connection
    if (!middleware) return res.send(`unable to ${method} on ${url}!`);

    // invoke the middleware!
    // TODO: recursively add next()
    middleware.func(req, res, () => middleware.link.func(req, res, middleware.link.next));
  }

  static(path: string): Server {
    return this;
  }


  use(urlOrMiddleware: string | Function, middleware?: Function): Server {
    if (typeof urlOrMiddleware === 'function') {
      ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'].forEach((verb: string) => {
        // TODO figure out how to handle pure middleware with no url
        this.middleware[verb]['*'] = urlOrMiddleware;
      });
      return this;
    }
    d('pure middleware added for', urlOrMiddleware);
    // add use to each of our verbs
    ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'].forEach((verb: string) => {
      // TODO figure out how to handle pure middleware with no urlOrMiddleware
      this.middleware[verb][urlOrMiddleware] = middleware;
    });
    return this;
  }

  private addMiddleware(method: string, url: string, middleware: Function): void {
    const curMethod = this.middleware[method];
    const newWare = { func: middleware, next: noop };
    // check if array and push
    if (Array.isArray(curMethod[url])) {
      curMethod[url].push(newWare);
      for (let i: number = 0; i < curMethod[url].length; i += 1) {
        const cur = curMethod[url][i];
        const nextLink = curMethod[url][i + 1];
        cur.link = nextLink;
      }
      // curMethod[url].forEach((mw: Middleware, idx: number) => {
      //   const next = curMethod[url][idx + 1] ? curMethod[url][idx + 1].func : noop;
      //   mw.next = next;
      // });
    } else {
      // if not, create and add index
      curMethod[url] = [newWare];
    }
    // special case for wildcard
  }

  get(url: string, middleware: Function): Server {
    d(`GET middleware for ${url} added`);
    this.addMiddleware('GET', url, middleware);
    return this;
  }

  put(url: string, middleware: Function): Server {
    d(`PUT middleware for ${url} added`);
    this.addMiddleware('PUT', url, middleware);
    return this;  
  }

  post(url: string, middleware: Function): Server {
    d(`POST middleware for ${url} added`);
    this.addMiddleware('POST', url, middleware);
    return this; 
  }

  patch(url: string, middleware: Function): Server {
    d(`PATCH middleware for ${url} added`);
    this.addMiddleware('PATCH', url, middleware);
    return this;
  }

  delete(url: string, middleware: Function): Server {
    d(`DELETE middleware for ${url} added`);
    this.addMiddleware('DELETE', url, middleware);
    return this;
  }
}

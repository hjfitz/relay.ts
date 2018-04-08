import http from 'http';
import https from 'https';
import { parse } from 'url';
import queryString from 'querystring';
import debug from 'debug';
import fs from 'fs';

import Request from './Request';
import Response from './Response';

const d = debug('server:Server');

interface VerbMiddleware {
  [key: string]: FunctionConstructor,
}



interface ServerMiddleware {
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

  private _server: https.Server | http.Server;
  private middleware: ServerMiddleware;
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

  private listener(req: http.IncomingMessage, res: http.ServerResponse) {
    d('connection to server made');
    // firstly, parse the request and response - make it a little more express-like
    const parsedRes = new Response(res);
    // go through each middleware, check and fire off
    // eventualy add a queue
    this.parseRequest(req).then(parsedReq => {
      d('Response and request parsed');
      this.handleRequest(parsedReq, parsedRes)
    });
  }

  private parseRequest(req: http.IncomingMessage): Promise<Request> {
    return new Promise((res, rej) => {

      // need to parse to METHOD & path at minimum
      req.on('close', () => console.log('//todo')); // to remove from queue
      
      const { url, headers, method, statusCode: code } = req;
      const { query, pathname } = parse(url || '');
      const parsedRequest = new Request({ url, headers, method, code, query, pathname}, req);
      const contentType = headers['content-type'];
      d(`content type: ${contentType}`);
      if (!('content-type' in headers)) {
        res(parsedRequest);
        return;
      }
      // handleIncomingStream returns itself - resolve after handling
      parsedRequest.handleIncomingStream(contentType).then(res);
    });
  }


  /**
   * @param cb Callback function to run when server is running
   */
  init(cb: Function): Server {
    this._server.listen(this.port);
    if (cb) cb();
    return this;
  }

  private handleRequest(req: Request, res: Response): void {
    const { method, url }: { method: string | undefined, url: string | undefined } = req;
    d(`method: ${method}, url: ${url}`);
    if (!method || !url) {
      res.send('no method!');
      return;
    }
    const middleware: Function = this.middleware[method][url];
    if (!middleware) {
      res.send(`unable to ${method} on ${url}!`);
      return;
    }

    middleware(req, res);
  }

  static(path: string): Server {
    return this;
  }

  use(urlOrMiddleware: string | Function, middleware: Function): Server {
    d('pure middleware added');
    // todo: figure out an efficient way to parse this
    // if (typeof urlOrMiddleware === 'string') {
    //   this.middleware.push({
    //     url: urlOrMiddleware,
    //     middleware,
    //   })
    // }
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
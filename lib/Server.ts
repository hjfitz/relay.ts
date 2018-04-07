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
  [key: string]: Function,
}



interface ServerMiddleware {
  pure: Function[],
  GET: VerbMiddleware[] | Object,
  POST: VerbMiddleware[] | Object,
  PUT: VerbMiddleware[] | Object,
  PATCH: VerbMiddleware[] | Object,
  DELETE: VerbMiddleware[] | Object
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

  private listener(req: http.IncomingMessage, res: http.ServerResponse) {
    // firstly, parse the request and response - make it a little more express-like
    const parsedRes = new Response(res);
    // go through each middleware, check and fire off
    // eventualy add a queue
    this.parseRequest(req).then(parsedReq => {
      this.handleRequest(parsedReq, parsedRes)
    });
  }

  private parseRequest(req: http.IncomingMessage): Promise<Request> {
    return new Promise((res, rej) => {

      // need to parse to METHOD & path at minimum
      req.on('close', () => console.log('//todo')); // to remove from queue
      
      const { url, headers, method, statusCode: code } = req;
      const { query, pathname } = parse(url || '');
      
      const parsedRequest = new Request({ url, headers, method, code, query, pathname});

      // TODO parse this more elegantly
      if (headers['content-type'] === 'application/json') {
        parsedRequest.parseJSON(req).then(res);
      } else {
        res(parsedRequest);
      }
    });
  }


  /**
   * @param cb Callback function to run when server is running
   */
  init(cb: Function) {
    this._server.listen(this.port);
    if (cb) cb();
  }

  handleRequest(req: Request, res: Response) {

  }

  use(urlOrMiddleware: string | Function, middleware: Function) {

  }

  get(url: string, middleware: Function) {

  }

  put(url: string, middleware: Function) {}

  post(url: string, middleware: Function) {}

  patch(url: string, middleware: Function) {}

  delete(url: string, middleware: Function) {}

}
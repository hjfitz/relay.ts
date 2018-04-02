import http from 'http';
import https from 'https';
import { parse } from 'url';
import queryString from 'querystring';
import debug from 'debug';
import fs from 'fs';

const d = debug('server:Server');

interface VerbMiddleware {
  [key: string]: Function,
}

interface ServerRequest {
  headers: http.IncomingHttpHeaders,
  method?: string,
  code: number | undefined,
  query: string | null,
  pathname?: string, 
  payload?: object
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
    const parsedReq = this.parseRequest(req);
    const parsedRes = this.parseResponse(res);
    // go through each middleware, check and fire off
    // eventualy add a queue
    parsedReq.then(console.log);
      // this.handleRequest(parsedReq, parsedRes);
  }

  private parseRequest(req: http.IncomingMessage): Promise<ServerRequest> {
    return new Promise((resolve, reject) => {

      // need to parse to METHOD & path at minimum
      req.on('close', () => console.log('//todo')); // to remove from queue
      
      const { url, headers, method, statusCode: code } = req;
      const { query, pathname } = parse(url || '');
      
      const parsedRequest: ServerRequest = { headers, method, code, query, pathname };
      
      // attempt to parse basic JSON
      if (headers['content-type'] === 'application/json') {
        let body: string = '';
        req.on('data', data => { body += data });
        req.on('end', () => {
          // attempt to parse JSON
          try {
            d('Attempting to parse');
            d(body);
            const parsed = JSON.parse(body);
            parsedRequest.payload = parsed;
          } catch(err) {
            d(err);
            d('unable to parse body');
          }
          resolve(parsedRequest)
        });
      } else {
        resolve(parsedRequest);
      }
    });
  }

  private parseResponse(resp: http.ServerResponse): ServerResponse {
    // need to add methods like JSON, send, sendState, sendFile, end

    const json = (payload: object, encoding: string = 'utf8') => new Promise((res, rej) => {
      d('responding with JSON');
      try {
        const serialised: string = JSON.stringify(payload);
        resp.write(serialised, encoding, res)
      } catch(err) {
        rej(err);
      }
    });

    const send = (payload: string, encoding: string = 'utf8') => {
      d('sending raw data');
      return new Promise(res => resp.write(payload, encoding, res));
    };

    const sendFile = (filename: string, encoding: string = 'utf8') => new Promise((res, rej) => {
      d('sending file');
      try {
        const contents = fs.readFileSync(filename);
        resp.write(contents, encoding, res);
      } catch(err) {
        rej(err);
      }
    })

    return {
      json,
      send,
      sendFile,
      sendStatus: () => {},
      end: () => resp.destroy(new Error('Server closed the connection')),
    };
  }

  /**
   * @param cb Callback function to run when server is running
   */
  init(cb: Function) {
    this._server.listen(this.port);
    if (cb) cb();
  }

  handleRequest(req: ServerRequest, res: ServerResponse) {

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
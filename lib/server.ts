import http from 'http';
import https from 'https';

interface VerbMiddleware {
  url: string,
  middleware: Function,
}

interface ServerMiddleware {
  pure: Function[],
  get: VerbMiddleware[],
  post: VerbMiddleware[],
  put: VerbMiddleware[],
  patch: VerbMiddleware[],
  delete: VerbMiddleware[]
}

export default class Server {

  _server: https.Server | http.Server;
  middleware: ServerMiddleware;
  port: number;

  constructor(port: number, useSSL: boolean = false, cert?: string, key?: string) {
    this.listener = this.listener.bind(this);
    this.port = port;
    if (useSSL) {
      this._server = https.createServer({ key, cert }, this.listener);
    } else {
      this._server = http.createServer(this.listener);
    }

    this.middleware = {
      pure: [],
      get: [],
      post: [],
      put: [],
      patch: [],
      delete: [],
    };
  }

  private parseRequest(req: http.IncomingMessage) {}

  private parseResponse(req: http.ServerResponse) {}

  private listener(req: http.IncomingMessage, res: http.ServerResponse) {
    // firstly, parse the request and response - make it a little more express-like
    const parsedReq = this.parseRequest(req);
    const parsedRes = this.parseResponse(res);
    // go through each middleware, check and fire off
    // eventualy add a queue
    console.log('get');
  }

  init(cb: Function) {
    this._server.listen(this.port);
    if (cb) cb();
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
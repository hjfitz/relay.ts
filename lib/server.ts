import http from 'http';
import https from 'https';


export default class Server {

  _server: https.Server | http.Server;
  port: number;

  constructor(port: number, useSSL: boolean = false, cert?: string, key?: string) {
    this.listener = this.listener.bind(this);
    this.port = port;
    if (useSSL) {
      this._server = https.createServer({ key, cert }, this.listener);
    } else {
      this._server = http.createServer(this.listener);
    }
  }

  private listener(req: http.IncomingMessage, res: http.ServerResponse) {
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
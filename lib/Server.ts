import http from 'http';
import https from 'https';
import { parse } from 'url';
import querystring from 'querystring';
import debug from 'debug';

import Request from './Request';
import Response from './Response';
import Router from './Router'

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
  private ssl: { key?: string, cert?: string };
  useSSL: Boolean;
  all: Function;
  get: Function;
  head: Function;
  patch: Function ;
  options: Function;
  delete: Function;
  post: Function;
  put: Function;
  use: Function;
  base: Router;

  constructor(port: number, useSSL: boolean = false, cert?: string, key?: string) {
    this.mwCount = 0;
    this.listener = this.listener.bind(this);
    this.port = port;
    this.useSSL = useSSL;
    // instantiate a http(s) server
    this.ssl = { key, cert };
    this._server = http.createServer(this.listener);
    if (this.useSSL) this._server = https.createServer(this.ssl, this.listener);
	this.base = new Router();
	this.all = this.base.add.bind(this.base, '*');
	this.use = this.base.add.bind(this.base, '*');
	this.get = this.base.add.bind(this.base, 'GET');
	this.head = this.base.add.bind(this.base, 'HEAD');
	this.patch = this.base.add.bind(this.base, 'PATCH');
	this.options = this.base.add.bind(this.base, 'OPTIONS');
	this.delete = this.base.add.bind(this.base, 'DELETE');
	this.post = this.base.add.bind(this.base, 'POST');
	this.put = this.base.add.bind(this.base, 'PUT');	

  }

    /**
   * @param cb Callback function to run when server is running
   */
  init(cb?: Function): Promise<Server> {
    this.base.prepareMiddleware();
    return new Promise((resolve: Function) => {
      this._server = http.createServer(this.listener);
      if (this.useSSL) this._server = https.createServer(this.ssl, this.listener);
      this._server.listen(this.port, () => {
        if (cb) cb();
        resolve(this);
      });
    });
  }

  close(cb?: Function): Promise<void> {
    return new Promise((resolve: Function) => {
      this._server.close(() => {
        if (cb) cb();
        resolve();
      });
    });
  }

  private listener(req: http.IncomingMessage, res: http.ServerResponse): void {
    d('===BEGINNING PARSE===');
    // firstly, parse the request and response - make it a little more express-like
    this.parseRequest(req).then((parsedReq: Request) => {
      const { method, url } = parsedReq;
	  // default to GET if no method
	  this.base.handleReq(parsedReq, res, method, url)
      d('===END PARSE===');
    });
  }

  // todo: add stack to req
  private parseRequest(req: http.IncomingMessage): Promise<Request> {
    // need to parse to METHOD & path at minimum
    // req.on('close', () => console.log('//todo'));

    // get what we're interested from the pure request
    const { url, headers, method, statusCode } = req;
    const { query, pathname } = parse(url || '');

    d('beginning request parse');
    // create request object
    const parsedRequest = new Request({
      statusCode,
      headers,
      method,
      req,
      query: querystring.parse(query || ''),
      url: pathname,
    });

    // attempt to parse incoming data
    const contentType = headers['content-type'];
    d(`content type: ${contentType}`);
    if (!('content-type' in headers)) return Promise.resolve(parsedRequest);

    d('parsing incoming stream...');
    // handleIncomingStream returns itself - resolve after handling
    return parsedRequest.handleIncomingStream(contentType);
  }
}

export default Server;

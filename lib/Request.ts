import http from 'http';
import debug from 'debug';
import qs from 'querystring';

const d = debug('server:Request');

interface IRequest {
  url: string | undefined,
  headers: http.IncomingHttpHeaders,
  method?: string,
  code: number | undefined,
  query: string | null,
  pathname?: string, 
  payload?: object
}

export default class Request {
  private _req: http.IncomingMessage;
  url: string;
  headers: http.IncomingHttpHeaders;
  method: string;
  code: number;
  query: string;
  pathname: string;
  payload?: object | string;

  constructor(options: IRequest, pure: http.IncomingMessage) {
    this.url = options.url || 'unknown';
    this.headers = options.headers;
    this.method = options.method || 'unknown';
    this.code = options.code || 500;
    this.query = options.query || '';
    this.pathname = options.pathname || '/';
    this._req = pure;

    d(`Request made to ${this.url}`);
  }

  handleIncomingStream(type?: string): Promise<Request> {
    return new Promise((res, rej) => {
      let body: string = '';
      this._req.on('data', data => { 
        if (body.length > 1e6) this._req.connection.destroy();
        body += data;
      });
      this._req.on('end', () => {
        this.parseData(body, type);
        res(this);
      });
    });
  }

  private parseData(body: string, type?: string): void {
    if (!type) return;
    if (type === 'application/json') {
      try {
        d('parsing application/json');
        d(body);
        const parsed = JSON.parse(body);
        d('parse successful');
        this.payload = parsed;
      } catch(err) {
        d(err);
        d('Unable to parse body');
      }
    } else if (type.includes('boundary') || body.includes('boundary')) {
      d('parsing form with boundary');
      const rip = type.split('=');
      console.log(rip);
      // const [,boundary] = ${bound.split('=')}`;
      // const keyVal = body.split(boundary.trim());
      // console.log('bound:',boundary)
      // console.log(body);
      // console.log(keyVal);
    } else if (type === 'application/x-www-form-urlencoded') {
      d('parsing form x-www-formdata');
      d(qs.parse(body));
      const parsedForm = qs.parse(body);
      d(typeof parsedForm);
      this.payload = parsedForm;
    } else {
      d('unknown header!', type);
      d('defaulting parse! keeping raw data');
      this.payload = body || '';
    }
  }
}

import http from 'http';
import debug from 'debug';
import querystring from 'querystring';

import * as util from './util';


const d = debug('relay:Request');

const parseCookies = (dough: string): Object => dough
  .split(';')
  .map((pair: string) => {
    const [key, ...vals]: string[] = pair.split('=');
    return { [key]: vals.join('=') };
  })
  .reduce((acc: Object, cur: { [x: string]: string; }) => Object.assign(acc, cur), {});

interface IRequest {
  url: string | undefined;
  headers: http.IncomingHttpHeaders;
  method?: string;
  statusCode: number | undefined;
  req: http.IncomingMessage;
  query: string | null;
  pathname?: string; 
  payload?: object;
}

class Request {
  _req: http.IncomingMessage;
  url: string;
  method: string;
  headers: http.IncomingHttpHeaders;
  code: number;
  query: object;
  payload?: object | string;
  cookies: Object;

  constructor(options: IRequest) {
    this.url = options.url || 'unknown';
    this.headers = options.headers || '';
    this.method = options.method || 'unknown';
    this.code = options.statusCode || 200;
    this.query = Request.parseQuery(options.query || '');
    this._req = options.req;
    this.cookies = parseCookies(this.headers.cookie || '');
    d(`Request made to ${this.url}`);
  }

  static parseQuery(query?: string): object {
    if (!query) return {};
    return query.split('&').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      acc[key] = value;
      return acc;
    },                             {});
  }

  handleIncomingStream(type?: string): Promise<Request> {
    return new Promise((res) => {
      let body: string = '';
      this._req.on('data', (data) => { 
        // kill early if we're getting too much info
        if (body.length > 1e6) this._req.connection.destroy();
        body += data;
      });
      this._req.on('end', () => {
        this.parseData(body, type);
        res(this);
      });
    });
  }

  parseData(body: string, type?: string): void {
    if (!type) return;
    if (type === 'text/plain') {
      this.payload = body;
    } else if (type === 'application/json') {
      try {
        d('parsing application/json');
        d(body);
        const parsed = JSON.parse(body);
        d('parse successful');
        this.payload = parsed;
      } catch (err) {
        d(err);
        d('Unable to parse body');
      }
    } else if (type.includes('boundary') || body.includes('Boundary')) {
      this.payload = util.parseBoundary(type, body);
    } else if (type === 'application/x-www-form-urlencoded') {
      d('parsing form x-www-formdata');
      d(querystring.parse(body));
      const parsedForm = querystring.parse(body);
      d(typeof parsedForm);
      this.payload = parsedForm;
    } else {
      d('unknown header!', type);
      d('defaulting parse! keeping raw data');
      this.payload = body || '';
    }
  }
}

export default Request;

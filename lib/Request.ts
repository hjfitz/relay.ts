import http from 'http';
import debug from 'debug';

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
  attrs: IRequest;
  constructor(options: IRequest) {
    this.attrs = options;
  }

  get url(): string | undefined {
    return this.attrs.url;
  }

  get headers(): http.IncomingHttpHeaders {
    return this.attrs.headers;
  }

  get method(): string | undefined {
    return this.attrs.method;
  }

  get code(): number {
    return this.attrs.code || 200; // we assume
  }

  get query(): string {
    return this.attrs.query || '';
  }

  get pathname(): string | undefined {
    return this.attrs.pathname;
  }

  get payload(): object {
    return this.attrs.payload || {};
  }

  set payload(payload: object) {
    this.attrs.payload = payload;
  }

  parseJSON(req: http.IncomingMessage): Promise<Request> {
    return new Promise((res, rej) => {
      let body: string = '';
      req.on('data', data => { body += data });
      req.on('end', () => {
        // attempt to parse JSON
        try {
          d('Attempting to parse');
          d(body);
          const parsed = JSON.parse(body);
          this.attrs.payload = parsed;
        } catch(err) {
          d(err);
          d('unable to parse body');
        }
        res(this);
      });
    })

  }

  parseForm(req: http.IncomingMessage): Promise<any> {
    return new Promise((req, res) => {
      
    })
  }
}

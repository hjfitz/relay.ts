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
  url: string;
  headers: http.IncomingHttpHeaders;
  method: string;
  code: number;
  query: string;
  pathname: string;
  payload?: object | string;
  _req: http.IncomingMessage;

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

  parseIncoming(type?: string): Promise<Request> {
    return new Promise((res, rej) => {
      let body: string = '';
      this._req.on('data', data => { 
        // limit data we allow
        if (body.length > 1e6) this._req.connection.destroy();
        body += data;
      });
      this._req.on('end', () => {
        switch (type) {
          case 'application/json': {
            try {
              d('Attempting to parse to object');
              d(body);
              const parsed = JSON.parse(body);
              this.payload = parsed;
            } catch(err) {
              d(err);
              d('Unable to parse body');
            }
          break;
        }
        case 'multipart/form-data': {
          // d(body);
          d(qs.parse(body));
          // do something
        }

        case 'application/x-www-form-urlencoded': {
          d('parsing form x-www-formdata');
          d(qs.parse(body));
          const parsedForm = qs.parse(body);
          d(typeof parsedForm);
          this.payload = parsedForm;
          break;
        }

        default: {
          d('defaulting parse! keeping raw data');
          this.payload = body || '';
        }
      }
      d(`using data: ${JSON.stringify(this.payload)}`);
      res(this);
        });
      });

  }


}

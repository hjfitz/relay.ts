import http from 'http';
import debug from 'debug';
import fs from 'fs';

const d = debug('server:Response');

export default class Response {

  httpResponse: http.ServerResponse;

  constructor(resp: http.ServerResponse) {
    this.httpResponse = resp;
  }

  json(payload: object, encoding: string = 'utf8'): Promise<any> {
    return new Promise((res, rej) => {
      d('responding with JSON');
      try {
        const serialised: string = JSON.stringify(payload);
        this.httpResponse.write(serialised, encoding, res)
      } catch(err) {
        rej(err);
      }
    });
  }
  
  send(payload: string, encoding: string = 'utf8'): Promise<any> {
    d('sending raw data');
    return new Promise(res => this.httpResponse.write(payload, encoding, res));
  };
  
  sendFile(filename: string, encoding: string = 'utf8'): Promise<any> {
    return new Promise((res, rej) => {
      d('sending file');
      try {
        const contents = fs.readFileSync(filename);
        this.httpResponse.write(contents, encoding, res);
      } catch(err) {
        rej(err);
      }
    })
  }
  
  sendStatus() {}

  end(): void {
    this.httpResponse.destroy(new Error('Server closed the connection'));
  }

}
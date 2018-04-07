import http from 'http';
import debug from 'debug';
import fs from 'fs';

const d = debug('server:Response');

export default class Response {

  httpResponse: http.ServerResponse;

  constructor(resp: http.ServerResponse) {
    this.httpResponse = resp;
  }

  send(payload: string, encoding: string = 'utf8'): void {
    d('sending raw data');
    this.httpResponse.write(payload, encoding, () => {
      this.httpResponse.end();
    });
  };
  
  sendFile(filename: string, encoding: string = 'utf8'): void {
    d('sending file');
    try {
      const contents: string = fs.readFileSync(filename).toString();
      this.send(contents, encoding);
    } catch(err) {
      d(err);
    }
  }

  json(payload: object): void {
    d('responding with JSON');
    try {
      const serialised: string = JSON.stringify(payload);
      this.send(serialised)
    } catch(err) {
      d(err);
      throw err;
    }
  }
  
  sendStatus() {}

  end(): void {
    this.httpResponse.destroy(new Error('Server closed the connection'));
  }

}
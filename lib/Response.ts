import http from 'http';
import debug from 'debug';
import fs from 'fs';
import Request from './Request';
import { Middleware } from './Server';

const d = debug('server:Response');

export default class Response {
  _res: http.ServerResponse;
  _req: Request;
  queue: Middleware[];

  constructor(resp: http.ServerResponse, req: Request, middleware: Middleware[]) {
    this._res = resp;
    this._req = req;
    this.queue = [...middleware];
    // default to plaintext response
    this._res.setHeader('content-type', 'text/plain');
    this._res.setHeader('Set-Cookie', ['set-by=ts-server', 'something-else=wasp']);
    this.getNext = this.getNext.bind(this);
  }

  getNext() {
    d('Returning next middleware for ', this._req.url);
    d({ queue: this.queue }, 'for', this._req.url);
    if (!this.queue.length) return this.send(`unable to ${this._req.method} on ${this._req.url}`);
    const next = this.queue.shift();
    if (next) return next.func(this._req, this, this.getNext);
  }

  /**
   * Send some data, and once it's flushed - end the connection
   * @param payload a string of data to send
   * @param encoding encoding to use
   */
  send(payload: string, encoding: string = 'utf8'): void {
    d('sending raw data', payload);
    this._res.write(payload, encoding, () => {
      this._res.end('\n');
    });
  }

  /**
   * read a file and send it
   * @param filename file to read
   * @param encoding encoding to read the file in
   */
  sendFile(filename: string, encoding: string = 'utf8'): void {
    d('sending file');
    try {
      const contents: string = fs.readFileSync(filename, { encoding }).toString();
      this.send(contents, encoding);
    } catch (err) {
      d(err);
    }
  }

  /**
   * serialise an object and send it
   * @param payload object to send
   */
  json(payload: object): void {
    d('responding with JSON');
    const serialised: string = JSON.stringify(payload);
    d('setting header content-type to application/json');
    this._res.setHeader('content-type', 'application/json');
    this.send(serialised);
  }

  /**
   * Set a message and code, and end the connection
   * @param code HTTP code to send
   * @param message Message to optionally send
   */
  sendStatus(code: number, message?: string): void {
    if (message) {
      this._res.statusMessage = message;
    }
    d(`Setting code to ${code}`);
    this._res.statusCode = code;
    this._res.end();
  }

  end(): void {
    d('closing connection');
    this._res.destroy(new Error('Server closed the connection'));
  }
}

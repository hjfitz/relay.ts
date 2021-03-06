import http from 'http';
import debug from 'debug';
import fs from 'fs';
import mimeTypes from 'mime-types';
import Request from './Request';
import { Middleware } from './Server';
import Router from './Router';

const d = debug('relay:Response');

export default class Response {
	private _res: http.ServerResponse;
	private _req: Request;
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

	getNext(): any {
		d('Returning next middleware for ', this._req.url);
		d('queue size:', this.queue.length, 'for', this._req.url);
		if (!this.queue.length) {
			return this.send(
				`unable to ${this._req.method} on ${this._req.url}`, 'text/plain', 'utf8', 404,
			);
		}
		const next = this.queue.shift();
		if (next) return next.func(this._req, this, this.getNext);
	}

	/**
	 * Send some data, and once it's flushed - end the connection
	 * @param payload a string of data to send
	 * @param encoding encoding to use
	 */
	send(
		payload: string,
		type: string = 'text/plain',
		encoding: string = 'utf8',
		code: number = 200,
	): void {
		d('sending raw data', payload);
		this._res.setHeader('Content-Type', type);
		this._res.writeHead(code, { 'Content-Type': type });
		this._res.write(payload, encoding, () => {
			this._res.end('\n');
			this._req._req.connection.destroy();
		});
	}

	/**
	 * read a file and send it
	 * @param filename file to read
	 * @param encoding encoding to read the file in
	 */
	sendFile(filename: string, encoding: string = 'utf8'): void {
		d('sending file');
		d('calculating mime type');
		const type = mimeTypes.lookup(filename) || undefined;
		d(`sending ${type}`);
		const contents: string = fs.readFileSync(filename, { encoding }).toString();
		this.send(contents, type, encoding);

	}

	/**
	 * serialise an object and send it
	 * @param payload object to send
	 */
	json(payload: object): void {
		d('responding with JSON');
		const serialised: string = JSON.stringify(payload);
		this.send(serialised, 'application/json');
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

/// <reference types="node" />
import http from 'http';
import Request from './Request';
import { Middleware } from './Server';
export default class Response {
    private _res;
    private _req;
    queue: Middleware[];
    constructor(resp: http.ServerResponse, req: Request, middleware: Middleware[]);
    getNext(): any;
    /**
     * Send some data, and once it's flushed - end the connection
     * @param payload a string of data to send
     * @param encoding encoding to use
     */
    send(payload: string, type?: string, encoding?: string, code?: number): void;
    /**
     * read a file and send it
     * @param filename file to read
     * @param encoding encoding to read the file in
     */
    sendFile(filename: string, encoding?: string): void;
    /**
     * serialise an object and send it
     * @param payload object to send
     */
    json(payload: object): void;
    /**
     * Set a message and code, and end the connection
     * @param code HTTP code to send
     * @param message Message to optionally send
     */
    sendStatus(code: number, message?: string): void;
    end(): void;
}

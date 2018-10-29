/// <reference types="node" />
import http from 'http';
import { IRequest } from './Server';
export default class Request {
    _req: http.IncomingMessage;
    url: string;
    headers: http.IncomingHttpHeaders;
    method: string;
    code: number;
    query: object;
    pathname: string;
    payload?: object | string;
    private _cookies;
    constructor(options: IRequest, pure: http.IncomingMessage);
    static parseQuery(query?: string): object;
    handleIncomingStream(type?: string): Promise<Request>;
    parseData(body: string, type?: string): void;
}

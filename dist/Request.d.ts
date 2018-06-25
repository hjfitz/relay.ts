/// <reference types="node" />
import http from 'http';
export interface IRequest {
    url: string | undefined;
    headers: http.IncomingHttpHeaders;
    method?: string;
    code: number | undefined;
    query: string | null;
    pathname?: string;
    payload?: object;
}
export default class Request {
    _req: http.IncomingMessage;
    url: string;
    headers: http.IncomingHttpHeaders;
    method: string;
    code: number;
    query: string;
    pathname: string;
    payload?: object | string;
    private _cookies;
    constructor(options: IRequest, pure: http.IncomingMessage);
    handleIncomingStream(type?: string): Promise<Request>;
    parseData(body: string, type?: string): void;
}

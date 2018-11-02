/// <reference types="node" />
import http from 'http';
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
declare class Request {
    _req: http.IncomingMessage;
    url: string;
    method: string;
    headers: http.IncomingHttpHeaders;
    code: number;
    query: object;
    payload?: object | string;
    cookies: Object;
    constructor(options: IRequest);
    static parseQuery(query?: string): object;
    handleIncomingStream(type?: string): Promise<Request>;
    parseData(body: string, type?: string): void;
}
export default Request;

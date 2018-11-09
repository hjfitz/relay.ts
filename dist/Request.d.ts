/// <reference types="node" />
import http from 'http';
import querystring from 'querystring';
interface IRequest {
    url: string | undefined;
    headers: http.IncomingHttpHeaders;
    method?: string;
    statusCode: number | undefined;
    req: http.IncomingMessage;
    query: querystring.ParsedUrlQuery;
    pathname?: string;
    payload?: object;
}
declare class Request {
    _req: http.IncomingMessage;
    url: string;
    method: string;
    headers: http.IncomingHttpHeaders;
    code: number;
    query: querystring.ParsedUrlQuery;
    payload?: object | string;
    cookies: Object;
    constructor(options: IRequest);
    handleIncomingStream(type?: string): Promise<Request>;
    parseData(body: string, type?: string): void;
}
export default Request;

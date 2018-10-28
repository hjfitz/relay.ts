/// <reference types="node" />
import http from 'http';
import https from 'https';
import Request from './Request';
import Response from './Response';
export interface VerbMiddleware {
    [key: string]: FunctionConstructor;
}
export interface Middleware {
    func: Function;
    idx: Number;
}
export interface IRequest {
    url: string | undefined;
    headers: http.IncomingHttpHeaders;
    method?: string;
    code: number | undefined;
    query: string | null;
    pathname?: string;
    payload?: object;
    urlMws: Middleware[];
}
export interface ServerMiddleware {
    [key: string]: Function | Object;
    GET: VerbMiddleware | Object;
    POST: VerbMiddleware | Object;
    PUT: VerbMiddleware | Object;
    PATCH: VerbMiddleware | Object;
    DELETE: VerbMiddleware | Object;
}
declare class Server {
    _server: https.Server | http.Server;
    mwCount: number;
    middleware: any;
    port: number;
    all: Function;
    get: Function;
    head: Function;
    patch: Function;
    options: Function;
    connect: Function;
    delete: Function;
    trace: Function;
    post: Function;
    put: Function;
    use: Function;
    constructor(port: number, useSSL?: boolean, cert?: string, key?: string);
    listener(req: http.IncomingMessage, res: http.ServerResponse): void;
    parseRequest(req: http.IncomingMessage): Promise<Request>;
    /**
     * @param cb Callback function to run when server is running
     */
    init(cb?: Function): Server;
    /**
     * go through each middleware, and add a next(), pointing to next function on that verb
     * doing this on init means that lookups are o(1)
     */
    prepareMiddleware(): void;
    handleRequest(req: Request, res: Response): void;
    private add(method, url, middleware?);
    private addMw(method, url, middleware);
}
export default Server;

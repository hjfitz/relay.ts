/// <reference types="node" />
import http from 'http';
import Request from './Request';
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
    private mwCount;
    private _server;
    private middleware;
    private port;
    private verbs;
    all: Function;
    get: Function;
    head: Function;
    patch: Function;
    options: Function;
    delete: Function;
    post: Function;
    put: Function;
    use: Function;
    constructor(port: number, useSSL?: boolean, cert?: string, key?: string);
    /**
   * @param cb Callback function to run when server is running
   */
    init(cb?: Function): Promise<Server>;
    listener(req: http.IncomingMessage, res: http.ServerResponse): void;
    parseRequest(req: http.IncomingMessage): Promise<Request>;
    /**
     * clean this the fuck up
     */
    prepareMiddleware(): void;
    private add(method, url, middleware?);
    private addMw(method, url, middleware);
}
export default Server;

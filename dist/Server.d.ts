/// <reference types="node" />
import http from 'http';
import https from 'https';
import Request from './Request';
import Response from './Response';
export interface VerbMiddleware {
    [key: string]: FunctionConstructor;
}
export interface ServerMiddleware {
    [key: string]: Function | Object;
    GET: VerbMiddleware | Object;
    POST: VerbMiddleware | Object;
    PUT: VerbMiddleware | Object;
    PATCH: VerbMiddleware | Object;
    DELETE: VerbMiddleware | Object;
}
export default class Server {
    _server: https.Server | http.Server;
    middleware: ServerMiddleware;
    port: number;
    waiting: ServerMiddleware[];
    constructor(port: number, useSSL?: boolean, cert?: string, key?: string);
    listener(req: http.IncomingMessage, res: http.ServerResponse): void;
    static parseRequest(req: http.IncomingMessage): Promise<Request>;
    /**
     * @param cb Callback function to run when server is running
     */
    init(cb: Function): Server;
    /**
     * go through each middleware, and add a next(), pointing to next function on that verb
     * doing this on init means that lookups are o(1)
     */
    prepareMiddleware(): void;
    handleRequest(req: Request, res: Response): void;
    static(path: string): Server;
    use(urlOrMiddleware: string | Function, middleware?: Function): Server;
    get(url: string, middleware: Function): Server;
    put(url: string, middleware: Function): Server;
    post(url: string, middleware: Function): Server;
    patch(url: string, middleware: Function): Server;
    delete(url: string, middleware: Function): Server;
}

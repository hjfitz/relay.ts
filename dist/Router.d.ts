/// <reference types="node" />
import debug from 'debug';
import http from 'http';
import Request from './Request';
declare class Router {
    private mwCount;
    private middleware;
    base: string;
    all: Function;
    get: Function;
    head: Function;
    patch: Function;
    options: Function;
    delete: Function;
    post: Function;
    put: Function;
    use: Function;
    d: debug.IDebugger;
    constructor();
    baseUrl: string;
    readonly isRouter: boolean;
    handleReq(parsedReq: Request, res: http.ServerResponse, method: string, url: string): any;
    /**
 * clean this the fuck up
 */
    prepareMiddleware(): void;
    private addMw;
    add(method: string, url: string | Function | Router, middleware?: Function): Router;
}
export default Router;

export default class Server {
    private _server;
    private middleware;
    port: number;
    constructor(port: number, useSSL?: boolean, cert?: string, key?: string);
    private listener(req, res);
    private parseRequest(req);
    /**
     * @param cb Callback function to run when server is running
     */
    init(cb: Function): Server;
    private handleRequest(req, res);
    static(path: string): Server;
    use(urlOrMiddleware: string | Function, middleware: Function): Server;
    get(url: string, middleware: Function): Server;
    put(url: string, middleware: Function): Server;
    post(url: string, middleware: Function): Server;
    patch(url: string, middleware: Function): Server;
    delete(url: string, middleware: Function): Server;
}

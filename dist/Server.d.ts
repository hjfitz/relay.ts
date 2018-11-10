export interface Middleware {
    func: Function;
    idx: Number;
}
declare class Server {
    private mwCount;
    private _server;
    private middleware;
    private port;
    private ssl;
    useSSL: Boolean;
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
    close(cb?: Function): Promise<void>;
    private listener;
    private parseRequest;
    /**
     * clean this the fuck up
     */
    private prepareMiddleware;
    private add;
    private addMw;
}
export default Server;

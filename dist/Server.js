"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var url_1 = require("url");
var debug_1 = __importDefault(require("debug"));
var Request_1 = __importDefault(require("./Request"));
var Response_1 = __importDefault(require("./Response"));
var d = debug_1.default('server:Server');
var Server = /** @class */ (function () {
    function Server(port, useSSL, cert, key) {
        if (useSSL === void 0) { useSSL = false; }
        this.mwCount = 0;
        this.listener = this.listener.bind(this);
        this.port = port;
        // instantiate a http(s) server
        this._server = http_1.default.createServer(this.listener);
        if (useSSL)
            this._server = https_1.default.createServer({ key: key, cert: cert }, this.listener);
        // this.middleware = { GET: {}, POST: {}, PUT: {}, PATCH: {}, DELETE: {} };
        this.middleware = {};
        this.all = this.add.bind(this, '*');
        this.use = this.add.bind(this, '*');
        this.get = this.add.bind(this, 'GET');
        this.head = this.add.bind(this, 'HEAD');
        this.patch = this.add.bind(this, 'PATCH');
        this.options = this.add.bind(this, 'OPTIONS');
        this.connect = this.add.bind(this, 'CONNECT');
        this.delete = this.add.bind(this, 'DELETE');
        this.trace = this.add.bind(this, 'TRACE');
        this.post = this.add.bind(this, 'POST');
        this.put = this.add.bind(this, 'PUT');
    }
    Server.prototype.listener = function (req, res) {
        var _this = this;
        d('connection to server made');
        // firstly, parse the request and response - make it a little more express-like
        this.parseRequest(req).then(function (parsedReq) {
            var method = parsedReq.method, pathname = parsedReq.pathname;
            // default to GET if no method
            var mws = _this.middleware[method || 'GET'];
            var urlMws = mws[pathname || '*'];
            console.log({ urlMws: urlMws });
            d('Response and request parsed');
            var parsedRes = new Response_1.default(res, parsedReq, urlMws);
            // go through each middleware, check and fire off
            // eventualy add a queue
            _this.handleRequest(parsedReq, parsedRes);
        });
    };
    // todo: add stack to req
    Server.prototype.parseRequest = function (req) {
        // need to parse to METHOD & path at minimum
        req.on('close', function () { return console.log('//todo'); }); // to remove from queue
        // get what we're interested from the pure request
        var url = req.url, headers = req.headers, method = req.method, code = req.statusCode;
        var _a = url_1.parse(url || ''), query = _a.query, pathname = _a.pathname;
        d('url parsed: ', pathname);
        // default to GET if no method
        var mws = this.middleware[method || 'GET'];
        var urlMws = mws[pathname || '*'];
        // console.log({ urlMws });
        // create request object
        var requestOpts = { url: url, headers: headers, method: method, code: code, query: query, pathname: pathname, urlMws: urlMws };
        var parsedRequest = new Request_1.default(requestOpts, req);
        // attempt to parse incoming data
        var contentType = headers['content-type'];
        d("content type: " + contentType);
        if (!('content-type' in headers))
            return Promise.resolve(parsedRequest);
        // handleIncomingStream returns itself - resolve after handling
        return parsedRequest.handleIncomingStream(contentType);
    };
    /**
     * @param cb Callback function to run when server is running
     */
    Server.prototype.init = function (cb) {
        this.prepareMiddleware();
        this._server.listen(this.port, function () {
            if (cb)
                cb();
        });
        return this;
    };
    /**
     * go through each middleware, and add a next(), pointing to next function on that verb
     * doing this on init means that lookups are o(1)
     */
    Server.prototype.prepareMiddleware = function () {
        var _this = this;
        d('preparing midleware');
        var all = this.middleware['*'];
        // apply all '*' to each method
        // todo: do this for every possible verb
        // go through each verb
        Object.keys(this.middleware).forEach(function (verb) {
            if (verb === '*')
                return;
            var middlewares = _this.middleware[verb];
            // go through each url on the middleware 
            Object.keys(all).forEach(function (url) {
                if (url in middlewares)
                    (_a = middlewares[url]).push.apply(_a, all[url]);
                else
                    middlewares[url] = all[url].slice();
                var _a;
            });
        });
        // d('parsed round 1', this.middleware);
        d('verbs handled');
        // append wildcards to each url
        Object.keys(this.middleware).forEach(function (verb) {
            var mwStack = _this.middleware[verb];
            var wildcard = mwStack['*'];
            Object.keys(mwStack).forEach(function (url) {
                if (url === '*')
                    return;
                var curStack = mwStack[url];
                if (wildcard)
                    curStack.push.apply(curStack, wildcard);
                curStack = curStack.sort(function (mw1, mw2) {
                    if (mw1.idx < mw2.idx)
                        return -1;
                    if (mw1.idx > mw2.idx)
                        return 1;
                    return 0;
                });
            });
        });
        d('wildcards handled');
        // d('parsed round 2', this.middleware);
        d('middleware prepped');
    };
    // todo: figure out how to do next() properly
    Server.prototype.handleRequest = function (req, res) {
        var method = req.method, url = req.url;
        d("method: " + method + ", url: " + url);
        // this should never happen
        if (!method || !url)
            return res.send('no method!');
        var middlewares = this.middleware[method][url];
        // nothing? let the user know, and close the connection
        if (!middlewares)
            return res.send("unable to " + method + " on " + url + "!");
        var middleware = middlewares[0];
        // invoke the middleware!
        middleware.func(req, res, res.getNext());
    };
    Server.prototype.add = function (method, url, middleware) {
        if (typeof url === 'string' && middleware)
            return this.addMw(method, url, middleware);
        if (url instanceof Function)
            return this.addMw(method, '*', url);
        throw new Error('should not get here');
    };
    Server.prototype.addMw = function (method, url, middleware) {
        var newWare = { func: middleware, idx: this.mwCount };
        if (!(method in this.middleware))
            this.middleware[method] = {};
        if (!(url in this.middleware[method]))
            this.middleware[method][url] = [newWare];
        else
            this.middleware[method][url].push(newWare);
        d(method + " middleware for " + url + " added");
        this.mwCount += 1;
        return this;
    };
    return Server;
}());
exports.default = Server;

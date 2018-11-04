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
var d = debug_1.default('relay:Server');
var Server = /** @class */ (function () {
    function Server(port, useSSL, cert, key) {
        if (useSSL === void 0) { useSSL = false; }
        this.mwCount = 0;
        this.listener = this.listener.bind(this);
        this.port = port;
        this.useSSL = useSSL;
        // instantiate a http(s) server
        this.ssl = { key: key, cert: cert };
        this._server = http_1.default.createServer(this.listener);
        if (this.useSSL)
            this._server = https_1.default.createServer(this.ssl, this.listener);
        this.middleware = { GET: {}, HEAD: {}, OPTIONS: {}, POST: {}, PUT: {}, PATCH: {}, DELETE: {} };
        this.all = this.add.bind(this, '*');
        this.use = this.add.bind(this, '*');
        this.get = this.add.bind(this, 'GET');
        this.head = this.add.bind(this, 'HEAD');
        this.patch = this.add.bind(this, 'PATCH');
        this.options = this.add.bind(this, 'OPTIONS');
        this.delete = this.add.bind(this, 'DELETE');
        this.post = this.add.bind(this, 'POST');
        this.put = this.add.bind(this, 'PUT');
    }
    /**
   * @param cb Callback function to run when server is running
   */
    Server.prototype.init = function (cb) {
        var _this = this;
        this.prepareMiddleware();
        return new Promise(function (resolve) {
            _this._server = http_1.default.createServer(_this.listener);
            if (_this.useSSL)
                _this._server = https_1.default.createServer(_this.ssl, _this.listener);
            _this._server.listen(_this.port, function () {
                if (cb)
                    cb();
                resolve(_this);
            });
        });
    };
    Server.prototype.close = function (cb) {
        var _this = this;
        return new Promise(function (resolve) {
            _this._server.close(function () {
                if (cb)
                    cb();
                resolve();
            });
        });
    };
    Server.prototype.listener = function (req, res) {
        var _this = this;
        d('===BEGINNING PARSE===');
        // firstly, parse the request and response - make it a little more express-like
        this.parseRequest(req).then(function (parsedReq) {
            var method = parsedReq.method, url = parsedReq.url;
            // default to GET if no method
            var mws = _this.middleware[method || 'GET'];
            var rawMws = mws[url || '*'] || mws['*'] || [];
            // shallow clone so resp has it's own queue
            var urlMws = rawMws.slice();
            d("queue size for " + url + ": " + urlMws.length);
            // first funciton is used immediately
            var curMw = urlMws.shift();
            var parsedRes = new Response_1.default(res, parsedReq, urlMws);
            d('Request and Response parsed');
            if (!curMw || !curMw.func)
                return parsedRes.getNext();
            curMw.func(parsedReq, parsedRes, parsedRes.getNext);
            d('===END PARSE===');
        });
    };
    // todo: add stack to req
    Server.prototype.parseRequest = function (req) {
        // need to parse to METHOD & path at minimum
        // req.on('close', () => console.log('//todo'));
        // get what we're interested from the pure request
        var url = req.url, headers = req.headers, method = req.method, statusCode = req.statusCode;
        var query = url_1.parse(url || '').query;
        d('beginning request parse');
        // create request object
        var parsedRequest = new Request_1.default({
            statusCode: statusCode,
            headers: headers,
            method: method,
            query: query,
            req: req,
            url: url,
        });
        // attempt to parse incoming data
        var contentType = headers['content-type'];
        d("content type: " + contentType);
        if (!('content-type' in headers))
            return Promise.resolve(parsedRequest);
        d('parsing incoming stream...');
        // handleIncomingStream returns itself - resolve after handling
        return parsedRequest.handleIncomingStream(contentType);
    };
    /**
     * clean this the fuck up
     */
    Server.prototype.prepareMiddleware = function () {
        var _this = this;
        d('preparing midleware');
        var all = this.middleware['*'];
        // apply all '*' to each method
        // go through each verb we currently have
        if (all) {
            Object.keys(this.middleware).forEach(function (verb) {
                if (verb === '*')
                    return;
                var middlewares = _this.middleware[verb];
                // go through each url on the middleware
                Object.keys(all).forEach(function (url) {
                    var _a;
                    if (url in middlewares)
                        (_a = middlewares[url]).push.apply(_a, all[url]);
                    else
                        middlewares[url] = all[url].slice();
                });
            });
        }
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
        d('middleware prepped');
        Object.freeze(this.middleware);
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
//# sourceMappingURL=Server.js.map
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
        this.listener = this.listener.bind(this);
        this.port = port;
        this._server = http_1.default.createServer(this.listener);
        if (useSSL) {
            this._server = https_1.default.createServer({ key: key, cert: cert }, this.listener);
        }
        this.middleware = {
            pure: [],
            GET: {},
            POST: {},
            PUT: {},
            PATCH: {},
            DELETE: {},
        };
    }
    Server.prototype.listener = function (req, res) {
        var _this = this;
        d('connection to server made');
        // firstly, parse the request and response - make it a little more express-like
        var parsedRes = new Response_1.default(res);
        // go through each middleware, check and fire off
        // eventualy add a queue
        this.parseRequest(req).then(function (parsedReq) {
            d('Response and request parsed');
            _this.handleRequest(parsedReq, parsedRes);
        });
    };
    Server.prototype.parseRequest = function (req) {
        return new Promise(function (res, rej) {
            // need to parse to METHOD & path at minimum
            req.on('close', function () { return console.log('//todo'); }); // to remove from queue
            var url = req.url, headers = req.headers, method = req.method, code = req.statusCode;
            var _a = url_1.parse(url || ''), query = _a.query, pathname = _a.pathname;
            var parsedRequest = new Request_1.default({ url: url, headers: headers, method: method, code: code, query: query, pathname: pathname }, req);
            var contentType = headers['content-type'];
            d("content type: " + contentType);
            if (!('content-type' in headers)) {
                res(parsedRequest);
                return;
            }
            // handleIncomingStream returns itself - resolve after handling
            parsedRequest.handleIncomingStream(contentType).then(res);
        });
    };
    /**
     * @param cb Callback function to run when server is running
     */
    Server.prototype.init = function (cb) {
        this.prepareMiddleware();
        this._server.listen(this.port);
        if (cb)
            cb();
        return this;
    };
    Server.prototype.prepareMiddleware = function () {
        var _this = this;
        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(function (verb) {
            var middlewares = Object.keys(_this.middleware[verb]);
            for (var i = 0; i < middlewares.length; i += 1) {
                var func = _this.middleware[verb][middlewares[i]];
                var next = _this.middleware[verb][middlewares[i + 1]];
                _this.middleware[verb][middlewares[i]] = { func: func, next: next };
                if (!next) {
                    var noop = function () { };
                    _this.middleware[verb][middlewares[i]] = { func: func, noop: noop };
                }
            }
        });
    };
    Server.prototype.handleRequest = function (req, res) {
        var method = req.method, url = req.url;
        d("method: " + method + ", url: " + url);
        if (!method || !url) {
            res.send('no method!');
            return;
        }
        var middleware = this.middleware[method][url];
        // nothing? let the user know, don't hang
        if (!middleware) {
            res.send("unable to " + method + " on " + url + "!");
            return;
        }
        // prepare next, if so desired
        var next = function () { return middleware.next(req, res); };
        middleware.func(req, res, next);
    };
    Server.prototype.static = function (path) {
        return this;
    };
    Server.prototype.enable = function (plugin) {
    };
    Server.prototype.use = function (urlOrMiddleware, middleware) {
        d('pure middleware added');
        // todo: figure out an efficient way to parse this
        // if (typeof urlOrMiddleware === 'string') {
        //   this.middleware.push({
        //     url: urlOrMiddleware,
        //     middleware,
        //   })
        // }
        return this;
    };
    Server.prototype.get = function (url, middleware) {
        d("GET middleware for " + url + " added");
        this.middleware.GET[url] = middleware;
        return this;
    };
    Server.prototype.put = function (url, middleware) {
        d("PUT middleware for " + url + " added");
        this.middleware.PUT[url] = middleware;
        return this;
    };
    Server.prototype.post = function (url, middleware) {
        d("POST middleware for " + url + " added");
        this.middleware.POST[url] = middleware;
        return this;
    };
    Server.prototype.patch = function (url, middleware) {
        d("PATCH middleware for " + url + " added");
        this.middleware.PATCH[url] = middleware;
        return this;
    };
    Server.prototype.delete = function (url, middleware) {
        d("DELETE middleware for " + url + " added");
        this.middleware.DELETE[url] = middleware;
        return this;
    };
    return Server;
}());
exports.default = Server;

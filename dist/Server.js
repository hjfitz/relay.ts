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
var util_1 = require("./util");
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
        Server.parseRequest(req).then(function (parsedReq) {
            d('Response and request parsed');
            var parsedRes = new Response_1.default(res);
            // go through each middleware, check and fire off
            // eventualy add a queue
            _this.handleRequest(parsedReq, parsedRes);
        });
    };
    Server.parseRequest = function (req) {
        return new Promise(function (res) {
            // need to parse to METHOD & path at minimum
            req.on('close', function () { return console.log('//todo'); }); // to remove from queue
            // get what we're interested from the pure request
            var url = req.url, headers = req.headers, method = req.method, code = req.statusCode;
            var _a = url_1.parse(url || ''), query = _a.query, pathname = _a.pathname;
            d(url_1.parse(url || ''));
            // create request object
            var requestOpts = { url: url, headers: headers, method: method, code: code, query: query, pathname: pathname };
            var parsedRequest = new Request_1.default(requestOpts, req);
            // attempt to parse incoming data
            var contentType = headers['content-type'];
            d("content type: " + contentType);
            if (!('content-type' in headers))
                return res(parsedRequest);
            // handleIncomingStream returns itself - resolve after handling
            parsedRequest.handleIncomingStream(contentType).then(res);
        });
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
        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].forEach(function (verb) {
            var middlewares = Object.keys(_this.middleware[verb]);
            d("middleware for " + verb + ": " + middlewares);
            for (var i = 0; i < middlewares.length; i += 1) {
                var cur = _this.middleware[verb]; // current set of middleware
                var idx = middlewares[i]; // current index
                var func = cur[idx];
                var next = cur[middlewares[i + 1]];
                cur[idx] = { func: func, next: next, idx: i };
                if (!next) {
                    cur[idx] = { func: func, next: util_1.noop, idx: i };
                }
                d('Set middleware for', verb, 'as', cur[idx]);
            }
        });
    };
    // todo: figure out how to do next() properly
    Server.prototype.handleRequest = function (req, res) {
        var method = req.method, url = req.url;
        d("method: " + method + ", url: " + url);
        // this should never happen
        if (!method || !url)
            return res.send('no method!');
        var middleware = this.middleware[method][url];
        // nothing? let the user know, and close the connection
        if (!middleware)
            return res.send("unable to " + method + " on " + url + "!");
        // invoke the middleware!
        middleware.func(req, res, function () { return middleware.next(req, res); });
    };
    Server.prototype.static = function (path) {
        return this;
    };
    Server.prototype.use = function (url, middleware) {
        var _this = this;
        d('pure middleware added for', url);
        // add use to each of our verbs
        ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'].forEach(function (verb) {
            // TODO figure out how to handle pure middleware with no url
            _this.middleware[verb][url] = middleware;
        });
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

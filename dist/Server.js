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
            d('reqponse and request parsed');
            _this.handleRequest(parsedReq, parsedRes);
        });
    };
    Server.prototype.parseRequest = function (req) {
        return new Promise(function (res, rej) {
            // need to parse to METHOD & path at minimum
            req.on('close', function () { return console.log('//todo'); }); // to remove from queue
            var url = req.url, headers = req.headers, method = req.method, code = req.statusCode;
            var _a = url_1.parse(url || ''), query = _a.query, pathname = _a.pathname;
            var parsedRequest = new Request_1.default({ url: url, headers: headers, method: method, code: code, query: query, pathname: pathname });
            // TODO parse this more elegantly
            if (headers['content-type'] === 'application/json') {
                parsedRequest.parseJSON(req).then(res);
            }
            else {
                res(parsedRequest);
            }
        });
    };
    /**
     * @param cb Callback function to run when server is running
     */
    Server.prototype.init = function (cb) {
        this._server.listen(this.port);
        if (cb)
            cb();
        return this;
    };
    Server.prototype.handleRequest = function (req, res) {
        var method = req.method, url = req.url;
        d("method: " + method + ", url: " + url);
        var middleware = this.middleware[method][url];
        if (!middleware) {
            res.send("unable to " + method + " " + url + "!");
            return;
        }
    };
    Server.prototype.use = function (urlOrMiddleware, middleware) { };
    Server.prototype.get = function (url, middleware) {
        d("GET middleware for " + url + " added");
        this.middleware.GET[url] = middleware;
        return this;
    };
    Server.prototype.put = function (url, middleware) {
        return this;
    };
    Server.prototype.post = function (url, middleware) {
        return this;
    };
    Server.prototype.patch = function (url, middleware) {
        return this;
    };
    Server.prototype.delete = function (url, middleware) {
        return this;
    };
    return Server;
}());
exports.default = Server;

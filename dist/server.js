"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var Server = /** @class */ (function () {
    function Server(port, useSSL, cert, key) {
        if (useSSL === void 0) { useSSL = false; }
        this.listener = this.listener.bind(this);
        this.port = port;
        if (useSSL) {
            this._server = https_1.default.createServer({ key: key, cert: cert }, this.listener);
        }
        else {
            this._server = http_1.default.createServer(this.listener);
        }
        this.middleware = {
            pure: [],
            get: [],
            post: [],
            put: [],
            patch: [],
            delete: [],
        };
    }
    Server.prototype.parseRequest = function (req) { };
    Server.prototype.parseResponse = function (req) { };
    Server.prototype.listener = function (req, res) {
        // go through each middleware, check and fire off
        // eventualy add a queue
        console.log('get');
    };
    Server.prototype.init = function (cb) {
        this._server.listen(this.port);
        if (cb)
            cb();
    };
    Server.prototype.use = function (urlOrMiddleware, middleware) {
    };
    Server.prototype.get = function (url, middleware) {
    };
    Server.prototype.put = function (url, middleware) { };
    Server.prototype.post = function (url, middleware) { };
    Server.prototype.patch = function (url, middleware) { };
    Server.prototype.delete = function (url, middleware) { };
    return Server;
}());
exports.default = Server;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var url_1 = require("url");
var debug_1 = __importDefault(require("debug"));
var fs_1 = __importDefault(require("fs"));
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
        // firstly, parse the request and response - make it a little more express-like
        var parsedReq = this.parseRequest(req);
        var parsedRes = this.parseResponse(res);
        // go through each middleware, check and fire off
        // eventualy add a queue
        parsedReq.then(console.log);
        // this.handleRequest(parsedReq, parsedRes);
    };
    Server.prototype.parseRequest = function (req) {
        return new Promise(function (resolve, reject) {
            // need to parse to METHOD & path at minimum
            req.on('close', function () { return console.log('//todo'); }); // to remove from queue
            var url = req.url, headers = req.headers, method = req.method, code = req.statusCode;
            var _a = url_1.parse(url || ''), query = _a.query, pathname = _a.pathname;
            var parsedRequest = { headers: headers, method: method, code: code, query: query, pathname: pathname };
            // attempt to parse basic JSON
            if (headers['content-type'] === 'application/json') {
                var body_1 = '';
                req.on('data', function (data) { body_1 += data; });
                req.on('end', function () {
                    // attempt to parse JSON
                    try {
                        d('Attempting to parse');
                        d(body_1);
                        var parsed = JSON.parse(body_1);
                        parsedRequest.payload = parsed;
                    }
                    catch (err) {
                        d(err);
                        d('unable to parse body');
                    }
                    resolve(parsedRequest);
                });
            }
            else {
                resolve(parsedRequest);
            }
        });
    };
    Server.prototype.parseResponse = function (resp) {
        // need to add methods like JSON, send, sendState, sendFile, end
        var json = function (payload, encoding) {
            if (encoding === void 0) { encoding = 'utf8'; }
            return new Promise(function (res, rej) {
                d('responding with JSON');
                try {
                    var serialised = JSON.stringify(payload);
                    resp.write(serialised, encoding, res);
                }
                catch (err) {
                    rej(err);
                }
            });
        };
        var send = function (payload, encoding) {
            if (encoding === void 0) { encoding = 'utf8'; }
            d('sending raw data');
            return new Promise(function (res) { return resp.write(payload, encoding, res); });
        };
        var sendFile = function (filename, encoding) {
            if (encoding === void 0) { encoding = 'utf8'; }
            return new Promise(function (res, rej) {
                d('sending file');
                try {
                    var contents = fs_1.default.readFileSync(filename);
                    resp.write(contents, encoding, res);
                }
                catch (err) {
                    rej(err);
                }
            });
        };
        return {
            json: json,
            send: send,
            sendFile: sendFile,
            sendStatus: function () { },
            end: function () { return resp.destroy(new Error('Server closed the connection')); },
        };
    };
    /**
     * @param cb Callback function to run when server is running
     */
    Server.prototype.init = function (cb) {
        this._server.listen(this.port);
        if (cb)
            cb();
    };
    Server.prototype.handleRequest = function (req, res) {
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

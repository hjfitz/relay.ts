"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = __importDefault(require("http"));
var https_1 = __importDefault(require("https"));
var url_1 = require("url");
var querystring_1 = __importDefault(require("querystring"));
var debug_1 = __importDefault(require("debug"));
var Request_1 = __importDefault(require("./Request"));
var Router_1 = __importDefault(require("./Router"));
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
        this.base = new Router_1.default();
        this.all = this.base.add.bind(this.base, '*');
        this.use = this.base.add.bind(this.base, '*');
        this.get = this.base.add.bind(this.base, 'GET');
        this.head = this.base.add.bind(this.base, 'HEAD');
        this.patch = this.base.add.bind(this.base, 'PATCH');
        this.options = this.base.add.bind(this.base, 'OPTIONS');
        this.delete = this.base.add.bind(this.base, 'DELETE');
        this.post = this.base.add.bind(this.base, 'POST');
        this.put = this.base.add.bind(this.base, 'PUT');
    }
    /**
   * @param cb Callback function to run when server is running
   */
    Server.prototype.init = function (cb) {
        var _this = this;
        this.base.prepareMiddleware();
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
            _this.base.handleReq(parsedReq, res, method, url);
            d('===END PARSE===');
        });
    };
    // todo: add stack to req
    Server.prototype.parseRequest = function (req) {
        // need to parse to METHOD & path at minimum
        // req.on('close', () => console.log('//todo'));
        // get what we're interested from the pure request
        var url = req.url, headers = req.headers, method = req.method, statusCode = req.statusCode;
        var _a = url_1.parse(url || ''), query = _a.query, pathname = _a.pathname;
        d('beginning request parse');
        // create request object
        var parsedRequest = new Request_1.default({
            statusCode: statusCode,
            headers: headers,
            method: method,
            req: req,
            query: querystring_1.default.parse(query || ''),
            url: pathname,
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
    return Server;
}());
exports.default = Server;
//# sourceMappingURL=Server.js.map
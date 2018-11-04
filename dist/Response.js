"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var fs_1 = __importDefault(require("fs"));
var mime_types_1 = __importDefault(require("mime-types"));
var d = debug_1.default('relay:Response');
var Response = /** @class */ (function () {
    function Response(resp, req, middleware) {
        this._res = resp;
        this._req = req;
        this.queue = middleware.slice();
        // default to plaintext response
        this._res.setHeader('content-type', 'text/plain');
        this._res.setHeader('Set-Cookie', ['set-by=ts-server', 'something-else=wasp']);
        this.getNext = this.getNext.bind(this);
    }
    Response.prototype.getNext = function () {
        d('Returning next middleware for ', this._req.url);
        d('queue size:', this.queue.length, 'for', this._req.url);
        if (!this.queue.length)
            return this.send("unable to " + this._req.method + " on " + this._req.url);
        var next = this.queue.shift();
        if (next)
            return next.func(this._req, this, this.getNext);
    };
    /**
     * Send some data, and once it's flushed - end the connection
     * @param payload a string of data to send
     * @param encoding encoding to use
     */
    Response.prototype.send = function (payload, type, encoding) {
        var _this = this;
        if (type === void 0) { type = 'text/plain'; }
        if (encoding === void 0) { encoding = 'utf8'; }
        d('sending raw data', payload);
        this._res.setHeader('Content-Type', type);
        this._res.writeHead(200, { 'Content-Type': type });
        this._res.write(payload, encoding, function () {
            _this._res.end('\n');
            _this._req._req.connection.destroy();
        });
    };
    /**
     * read a file and send it
     * @param filename file to read
     * @param encoding encoding to read the file in
     */
    Response.prototype.sendFile = function (filename, encoding) {
        if (encoding === void 0) { encoding = 'utf8'; }
        d('sending file');
        d('calculating mime type');
        var type = mime_types_1.default.lookup(filename) || undefined;
        d("sending " + type);
        var contents = fs_1.default.readFileSync(filename, { encoding: encoding }).toString();
        this.send(contents, type, encoding);
    };
    /**
     * serialise an object and send it
     * @param payload object to send
     */
    Response.prototype.json = function (payload) {
        d('responding with JSON');
        var serialised = JSON.stringify(payload);
        this.send(serialised, 'application/json');
    };
    /**
     * Set a message and code, and end the connection
     * @param code HTTP code to send
     * @param message Message to optionally send
     */
    Response.prototype.sendStatus = function (code, message) {
        if (message) {
            this._res.statusMessage = message;
        }
        d("Setting code to " + code);
        this._res.statusCode = code;
        this._res.end();
    };
    Response.prototype.end = function () {
        d('closing connection');
        this._res.destroy(new Error('Server closed the connection'));
    };
    return Response;
}());
exports.default = Response;
//# sourceMappingURL=Response.js.map
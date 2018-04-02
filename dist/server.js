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
    }
    Server.prototype.listener = function (req, res) {
        console.log('get');
    };
    Server.prototype.init = function (cb) {
        this._server.listen(this.port);
        if (cb)
            cb();
    };
    return Server;
}());
exports.default = Server;

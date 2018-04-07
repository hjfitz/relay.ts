"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var fs_1 = __importDefault(require("fs"));
var d = debug_1.default('server:Response');
var Response = /** @class */ (function () {
    function Response(resp) {
        this.httpResponse = resp;
    }
    Response.prototype.send = function (payload, encoding) {
        var _this = this;
        if (encoding === void 0) { encoding = 'utf8'; }
        d('sending raw data');
        this.httpResponse.write(payload, encoding, function () {
            _this.httpResponse.end();
        });
    };
    ;
    Response.prototype.sendFile = function (filename, encoding) {
        if (encoding === void 0) { encoding = 'utf8'; }
        d('sending file');
        try {
            var contents = fs_1.default.readFileSync(filename).toString();
            this.send(contents, encoding);
        }
        catch (err) {
            d(err);
        }
    };
    Response.prototype.json = function (payload) {
        d('responding with JSON');
        try {
            var serialised = JSON.stringify(payload);
            this.send(serialised);
        }
        catch (err) {
            d(err);
            throw err;
        }
    };
    Response.prototype.sendStatus = function () { };
    Response.prototype.end = function () {
        this.httpResponse.destroy(new Error('Server closed the connection'));
    };
    return Response;
}());
exports.default = Response;

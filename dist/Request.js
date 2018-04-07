"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var d = debug_1.default('server:Request');
var Request = /** @class */ (function () {
    function Request(options) {
        this.attrs = options;
    }
    Object.defineProperty(Request.prototype, "url", {
        get: function () {
            return this.attrs.url;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Request.prototype, "headers", {
        get: function () {
            return this.attrs.headers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Request.prototype, "method", {
        get: function () {
            return this.attrs.method;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Request.prototype, "code", {
        get: function () {
            return this.attrs.code || 200; // we assume
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Request.prototype, "query", {
        get: function () {
            return this.attrs.query || '';
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Request.prototype, "pathname", {
        get: function () {
            return this.attrs.pathname;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Request.prototype, "payload", {
        get: function () {
            return this.attrs.payload || {};
        },
        set: function (payload) {
            this.attrs.payload = payload;
        },
        enumerable: true,
        configurable: true
    });
    Request.prototype.parseJSON = function (req) {
        var _this = this;
        return new Promise(function (res, rej) {
            var body = '';
            req.on('data', function (data) { body += data; });
            req.on('end', function () {
                // attempt to parse JSON
                try {
                    d('Attempting to parse');
                    d(body);
                    var parsed = JSON.parse(body);
                    _this.attrs.payload = parsed;
                }
                catch (err) {
                    d(err);
                    d('unable to parse body');
                }
                res(_this);
            });
        });
    };
    Request.prototype.parseForm = function (req) {
        return new Promise(function (req, res) {
        });
    };
    return Request;
}());
exports.default = Request;

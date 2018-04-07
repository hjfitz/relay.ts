"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var querystring_1 = __importDefault(require("querystring"));
var d = debug_1.default('server:Request');
var Request = /** @class */ (function () {
    function Request(options, pure) {
        this.url = options.url || 'unknown';
        this.headers = options.headers;
        this.method = options.method || 'unknown';
        this.code = options.code || 500;
        this.query = options.query || '';
        this.pathname = options.pathname || '/';
        this._req = pure;
        d("Request made to " + this.url);
    }
    Request.prototype.parseIncoming = function (type) {
        var _this = this;
        return new Promise(function (res, rej) {
            var body = '';
            _this._req.on('data', function (data) {
                // limit data we allow
                if (body.length > 1e6)
                    _this._req.connection.destroy();
                body += data;
            });
            _this._req.on('end', function () {
                switch (type) {
                    case 'application/json': {
                        try {
                            d('Attempting to parse to object');
                            d(body);
                            var parsed = JSON.parse(body);
                            _this.payload = parsed;
                        }
                        catch (err) {
                            d(err);
                            d('Unable to parse body');
                        }
                        break;
                    }
                    case 'multipart/form-data': {
                        // d(body);
                        d(querystring_1.default.parse(body));
                        // do something
                    }
                    case 'application/x-www-form-urlencoded': {
                        d('parsing form x-www-formdata');
                        d(querystring_1.default.parse(body));
                        var parsedForm = querystring_1.default.parse(body);
                        d(typeof parsedForm);
                        _this.payload = parsedForm;
                        break;
                    }
                    default: {
                        d('defaulting parse! keeping raw data');
                        _this.payload = body || '';
                    }
                }
                d("using data: " + JSON.stringify(_this.payload));
                res(_this);
            });
        });
    };
    return Request;
}());
exports.default = Request;

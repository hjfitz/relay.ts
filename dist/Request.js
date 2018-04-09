"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var querystring_1 = __importDefault(require("querystring"));
var lang_1 = require("lodash/lang");
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
    Request.prototype.handleIncomingStream = function (type) {
        var _this = this;
        return new Promise(function (res, rej) {
            var body = '';
            _this._req.on('data', function (data) {
                if (body.length > 1e6)
                    _this._req.connection.destroy();
                body += data;
            });
            _this._req.on('end', function () {
                _this.parseData(body, type);
                res(_this);
            });
        });
    };
    Request.prototype.parseData = function (body, type) {
        if (!type)
            return;
        if (type === 'text/plain') {
            this.payload = body;
        }
        else if (type === 'application/json') {
            try {
                d('parsing application/json');
                d(body);
                var parsed = JSON.parse(body);
                d('parse successful');
                this.payload = parsed;
            }
            catch (err) {
                d(err);
                d('Unable to parse body');
            }
        }
        else if (type.includes('boundary') || body.includes('Boundary')) {
            d('parsing form with boundary');
            var _a = type.split('='), delim = _a[1];
            var splitBody = body.split('\n').map(function (line) { return line.replace(/\r/g, ''); });
            var keySplit = [];
            var cur = [];
            for (var i = 0; i < splitBody.length; i += 1) {
                var line = splitBody[i];
                if (line.includes(delim)) {
                    if (cur.length)
                        keySplit.push(lang_1.clone(cur));
                    cur.length = 0;
                }
                else {
                    if (line.length)
                        cur.push(line);
                }
            }
            this.payload = keySplit.map(function (pair) {
                var unparsedKey = pair[0], rest = pair.slice(1);
                var key = unparsedKey.replace('Content-Disposition: form-data; name=', '').replace(/"/g, '');
                var joined = rest.join();
                return _a = {}, _a[key] = rest.join(), _a;
                var _a;
            }).reduce(function (acc, cur) { return Object.assign(acc, cur); }, {});
        }
        else if (type === 'application/x-www-form-urlencoded') {
            d('parsing form x-www-formdata');
            d(querystring_1.default.parse(body));
            var parsedForm = querystring_1.default.parse(body);
            d(typeof parsedForm);
            this.payload = parsedForm;
        }
        else {
            d('unknown header!', type);
            d('defaulting parse! keeping raw data');
            this.payload = body || '';
        }
    };
    return Request;
}());
exports.default = Request;

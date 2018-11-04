"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var querystring_1 = __importDefault(require("querystring"));
var util = __importStar(require("./util"));
var d = debug_1.default('relay:Request');
var parseCookies = function (dough) { return dough
    .split(';')
    .map(function (pair) {
    var _a;
    var _b = pair.split('='), key = _b[0], vals = _b.slice(1);
    return _a = {}, _a[key] = vals.join('='), _a;
})
    .reduce(function (acc, cur) { return Object.assign(acc, cur); }, {}); };
var Request = /** @class */ (function () {
    function Request(options) {
        this.url = options.url || 'unknown';
        this.headers = options.headers || '';
        this.method = options.method || 'unknown';
        this.code = options.statusCode || 200;
        this.query = Request.parseQuery(options.query || '');
        this._req = options.req;
        this.cookies = parseCookies(this.headers.cookie || '');
        d("Request made to " + this.url);
    }
    Request.parseQuery = function (query) {
        if (!query)
            return {};
        return query.split('&').reduce(function (acc, pair) {
            var _a = pair.split('='), key = _a[0], value = _a[1];
            acc[key] = value;
            return acc;
        }, {});
    };
    Request.prototype.handleIncomingStream = function (type) {
        var _this = this;
        return new Promise(function (res) {
            var body = '';
            _this._req.on('data', function (data) {
                // kill early if we're getting too much info
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
            this.payload = util.parseBoundary(type, body);
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
//# sourceMappingURL=Request.js.map
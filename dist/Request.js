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
        this._cookies = pure.rawHeaders;
        d("Request made to " + this.url);
    }
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

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
        if (type === 'application/json') {
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
        else if (type.includes('boundary') || body.includes('boundary')) {
            d('parsing form with boundary');
            var rip = type.split('=');
            console.log(rip);
            // const [,boundary] = ${bound.split('=')}`;
            // const keyVal = body.split(boundary.trim());
            // console.log('bound:',boundary)
            // console.log(body);
            // console.log(keyVal);
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

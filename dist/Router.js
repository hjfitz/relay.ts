"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var Response_1 = __importDefault(require("./Response"));
var d = debug_1.default('relay:Router');
var Router = /** @class */ (function () {
    function Router() {
        d('router created');
        this.base = '';
        this.mwCount = 0;
        this.d = debug_1.default("relay:Router:" + this.base);
        this.middleware = { GET: {}, HEAD: {}, OPTIONS: {}, POST: {}, PUT: {}, PATCH: {}, DELETE: {} };
        this.all = this.add.bind(this, '*');
        this.use = this.add.bind(this, '*');
        this.get = this.add.bind(this, 'GET');
        this.head = this.add.bind(this, 'HEAD');
        this.patch = this.add.bind(this, 'PATCH');
        this.options = this.add.bind(this, 'OPTIONS');
        this.delete = this.add.bind(this, 'DELETE');
        this.post = this.add.bind(this, 'POST');
        this.put = this.add.bind(this, 'PUT');
    }
    Object.defineProperty(Router.prototype, "baseUrl", {
        // only use is debugging
        set: function (newUrl) {
            this.d = debug_1.default("relay:Router:" + newUrl);
            this.d("setting baseUrl to \"" + newUrl + "\"");
            this.base = newUrl;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Router.prototype, "isRouter", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    Router.prototype.handleReq = function (parsedReq, res, method, url) {
        var mws = this.middleware[method || 'GET'];
        this.d({ url: url });
        var paths = url.split('/');
        var idx = paths.length;
        var curUrl = paths.join('/');
        var rawMws = mws[url];
        while (!rawMws && curUrl !== '') {
            idx--;
            curUrl = curUrl.replace('/' + paths[idx], '');
            rawMws = mws[curUrl];
            if (idx < 0)
                break;
        }
        rawMws = rawMws || mws['*'] || [];
        // shallow clone so resp has it's own queue
        var urlMws = rawMws.slice();
        this.d("queue size for " + url + ": " + urlMws.length);
        // first funciton is used immediately
        var curMw = urlMws.shift();
        if (curMw.func && curMw.func instanceof Router) {
            curMw.func.handleReq(parsedReq, res, method, url);
            return;
        }
        var parsedRes = new Response_1.default(res, parsedReq, urlMws);
        this.d('Request and Response parsed');
        if (!curMw || !curMw.func)
            return parsedRes.getNext();
        curMw.func(parsedReq, parsedRes, parsedRes.getNext);
    };
    /**
 * clean this the fuck up
 */
    Router.prototype.prepareMiddleware = function () {
        var _this = this;
        this.d('preparing midleware');
        var all = this.middleware['*'];
        // apply all '*' to each method
        // go through each verb we currently have
        if (all) {
            Object.keys(this.middleware).forEach(function (verb) {
                if (verb === '*')
                    return;
                var middlewares = _this.middleware[verb];
                // go through each url on the middleware
                Object.keys(all).forEach(function (url) {
                    var _a;
                    if (url in middlewares)
                        (_a = middlewares[url]).push.apply(_a, all[url]);
                    else
                        middlewares[url] = all[url].slice();
                });
            });
        }
        this.d('round 1: apply all wildward (method) middleware to each route');
        // append wildcards to each url
        Object.keys(this.middleware).forEach(function (verb) {
            var mwStack = _this.middleware[verb];
            var wildcard = mwStack['*'];
            Object.keys(mwStack).forEach(function (url) {
                if (url === '*')
                    return;
                var curStack = mwStack[url];
                if (wildcard)
                    curStack.push.apply(curStack, wildcard);
                curStack = curStack.sort(function (mw1, mw2) {
                    if (mw1.idx < mw2.idx)
                        return -1;
                    if (mw1.idx > mw2.idx)
                        return 1;
                    return 0;
                });
            });
        });
        this.d('round 2: apply all wildcard URLs');
        // finally, call prepare on all subrouters (where applicable)
        Object.keys(this.middleware).forEach(function (method) {
            Object.keys(_this.middleware[method]).forEach(function (url) {
                _this.middleware[method][url].forEach(function (middleware) {
                    if (middleware.func.isRouter)
                        middleware.func.prepareMiddleware();
                });
            });
        });
        this.d('round 3: apply prepareMiddleware to subrouters');
        this.d('wildcards handled');
        this.d('middleware prepped');
        Object.freeze(this.middleware);
    };
    Router.prototype.addMw = function (method, url, middleware) {
        if (middleware instanceof Router)
            middleware.baseUrl = url;
        var newWare = { func: middleware, idx: this.mwCount };
        // console.log(newWare)
        if (!(method in this.middleware))
            this.middleware[method] = {};
        if (!(url in this.middleware[method]))
            this.middleware[method][url] = [newWare];
        else
            this.middleware[method][url].push(newWare);
        this.d(method + " middleware for " + url + " added");
        this.mwCount += 1;
        return this;
    };
    Router.prototype.add = function (method, url, middleware) {
        if (typeof url === 'string' && middleware)
            return this.addMw(method, url, middleware);
        if (url instanceof Function || url instanceof Router)
            return this.addMw(method, '*', url);
        throw new Error('should not get here');
    };
    return Router;
}());
exports.default = Router;
//# sourceMappingURL=Router.js.map
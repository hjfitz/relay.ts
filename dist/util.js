"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var clone_1 = __importDefault(require("lodash/clone"));
var d = debug_1.default('relay:util');
exports.noop = function () { };
/**
 *
 * @param type
 * @param body
 */
function parseBoundary(type, body) {
    d('parsing form with boundary');
    var _a = type.split('='), delim = _a[1];
    d("delim: " + delim);
    var splitBody = body.split('\n').map(function (line) { return line.replace(/\r/g, ''); });
    var keySplit = [];
    var cur = [];
    for (var i = 0; i < splitBody.length; i += 1) {
        var line = splitBody[i];
        d(line);
        if (line.includes(delim)) {
            if (cur.length)
                keySplit.push(clone_1.default(cur));
            cur.length = 0;
        }
        else {
            if (line.length)
                cur.push(line);
        }
    }
    var parsed = keySplit.map(function (pair) {
        var _a;
        var unparsedKey = pair[0], rest = pair.slice(1);
        var key = unparsedKey
            .replace('Content-Disposition: form-data; name=', '')
            .replace(/"/g, '');
        return _a = {}, _a[key] = rest.join(), _a;
    }).reduce(function (acc, cur) { return Object.assign(acc, cur); }, {});
    return parsed;
}
exports.parseBoundary = parseBoundary;
function useStatic(absolute) {
    if (!fs_1.default.existsSync(absolute))
        throw new Error("folder doesn't exist!");
    return function staticFiles(req, res, next) {
        var resourcePath = path_1.default.join(absolute, req.url);
        d("Attempting to retrieve for " + req.url);
        if (!fs_1.default.existsSync(resourcePath))
            return next();
        res.sendFile(resourcePath);
    };
}
exports.useStatic = useStatic;
//# sourceMappingURL=util.js.map
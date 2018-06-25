"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var lang_1 = require("lodash/lang");
var d = debug_1.default('Server:util');
function noop() { }
exports.noop = noop;
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
                keySplit.push(lang_1.clone(cur));
            cur.length = 0;
        }
        else {
            if (line.length)
                cur.push(line);
        }
    }
    var parsed = keySplit.map(function (pair) {
        var unparsedKey = pair[0], rest = pair.slice(1);
        var key = unparsedKey.replace('Content-Disposition: form-data; name=', '').replace(/"/g, '');
        return _a = {}, _a[key] = rest.join(), _a;
        var _a;
    }).reduce(function (acc, cur) { return Object.assign(acc, cur); }, {});
    return parsed;
}
exports.parseBoundary = parseBoundary;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var debug_1 = __importDefault(require("debug"));
var Server_1 = __importDefault(require("./Server"));
var assert_1 = __importDefault(require("assert"));
var d = debug_1.default('relay:index');
function createServer(options) {
    d('creating server');
    // check for options
    assert_1.default(options, 'Options missing!');
    // check for port
    assert_1.default('port' in options, 'Port missing in options!');
    var useSSL = ('cert' in options) && ('key' in options);
    d("Uses SSL: " + useSSL);
    var port = options.port, cert = options.cert, key = options.key, plugins = options.plugins;
    d("port: " + port);
    var server;
    if (useSSL) {
        server = new Server_1.default(port, useSSL, cert, key);
    }
    else {
        server = new Server_1.default(port);
    }
    return server;
}
exports.createServer = createServer;
var util_1 = require("./util");
exports.useStatic = util_1.useStatic;
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Server_1 = __importDefault(require("./Server"));
var debug_1 = __importDefault(require("debug"));
var d = debug_1.default('server:index');
;
exports.createServer = function (options) {
    d('creating server');
    // check for options
    if (!options)
        throw new Error('Options missing!');
    // check for port
    if (!('port' in options)) {
        throw new Error('Port missing in options!');
    }
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
    if (plugins) {
        plugins.forEach(function (plugin) { return server.enable(plugin); });
    }
    return server;
};

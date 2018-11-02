import debug from 'debug';
import Server, { Middleware } from './Server';
import assert from 'assert';

const d = debug('relay:index');


export interface ServerOptions {
  port: number;
  cert?: string;
  key?: string;
  plugins?: string[];
};

export const createServer = (options: ServerOptions): Server => {
  d('creating server');
  // check for options
  assert(options, 'Options missing!');
  
  // check for port
  assert('port' in options, 'Port missing in options!');
  

  const useSSL: boolean = ('cert' in options) && ('key' in options);
  d(`Uses SSL: ${useSSL}`);
  
  const { port, cert, key, plugins } = options;
  d(`port: ${port}`);

  let server: Server;

  if (useSSL) {
    server = new Server(port, useSSL, cert, key);
  } else {
    server = new Server(port);
  }

  return server;
};

import Server from './Server';
import debug from 'debug';

const d = debug('server:index');


export interface ServerOptions {
  port: number,
  cert?: string,
  key?: string,
  plugins?: string[],
};



export const createServer = (options: ServerOptions): Server => {
  d('creating server');
  // check for options
  if (!options) throw new Error('Options missing!');
  
  // check for port
  if (!('port' in options))  {
    throw new Error('Port missing in options!');
  }

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

   if (plugins) {
     plugins.forEach(plugin => server.enable(plugin));
   }

   return server;

};

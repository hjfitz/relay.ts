import Server from './server';
import debug from 'debug';

const d = debug('server:index');

interface ServerOptions {
  port: number,
  cert?: string,
  key?: string,
}

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
  
  const { port, cert, key } = options;
  d(`port: ${port}`);

  if (useSSL) return new Server(port, useSSL, cert, key);
  return new Server(port);

};

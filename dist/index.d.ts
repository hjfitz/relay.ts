import Server from './Server';
export interface ServerOptions {
    port: number;
    cert?: string;
    key?: string;
    plugins?: string[];
}
export declare function createServer(options: ServerOptions): Server;
export { useStatic } from './util';
export { default as Router } from './Router';

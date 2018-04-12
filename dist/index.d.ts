import Server from './Server';
export interface ServerOptions {
    port: number;
    cert?: string;
    key?: string;
    plugins?: string[];
}
export declare const createServer: (options: ServerOptions) => Server;

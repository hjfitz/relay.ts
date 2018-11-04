import Server from './Server';
export interface ServerOptions {
    port: number;
    cert?: string;
    key?: string;
    plugins?: string[];
}
export default function createServer(options: ServerOptions): Server;
export { useStatic } from './util';

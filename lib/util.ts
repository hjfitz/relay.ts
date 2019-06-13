import debug from 'debug';
import fs from 'fs';
import path from 'path';

import Request from './Request';
import Response from './Response';

const d = debug('relay:util');

export const noop = () => {};

/**
 *
 * @param type
 * @param body
 */
export function parseBoundary(type: string, body: string): object {
	d('parsing form with boundary');
	const [, delim]: string[] = type.split('=');
	d(`delim: ${delim}`);
	const splitBody: string[] = body.split('\n').map(line => line.replace(/\r/g, ''));
	const keySplit: string[][] = [];
	const cur: string[] = [];

	for (let i: number = 0; i < splitBody.length; i += 1) {
		const line: string = splitBody[i];
		d(line);
		if (line.includes(delim)) {
			if (cur.length) keySplit.push([...cur]);
			cur.length = 0;
		} else {
			if (line.length) cur.push(line);
		}
	}

	const parsed: object = keySplit.map((pair: string[]) => {
		const [unparsedKey, ...rest]: string[] = pair;
		const key: string = unparsedKey
		.replace('Content-Disposition: form-data; name=', '')
		.replace(/"/g, '');
		return { [key]: rest.join() };
	}).reduce((acc, cur) => Object.assign(acc, cur), {});

	return parsed;
}

export function useStatic(absolute: string): Function {
	if (!fs.existsSync(absolute)) throw new Error("folder doesn't exist!");
	return function staticFiles(req: Request, res: Response, next: Function): void {
		const resourcePath = path.join(absolute, req.url);
		d(`Attempting to retrieve for ${req.url}`);
		d(resourcePath);
		if (!fs.existsSync(resourcePath) || fs.lstatSync(resourcePath).isDirectory()) return next();
		res.sendFile(resourcePath);
	};
}

import debug from 'debug';
import clone from 'lodash/clone';

const d = debug('Server:util');

export const noop = () => {};

/**
 * 
 * @param type 
 * @param body 
 */
export function parseBoundary(type: string, body: string): object {
  d('parsing form with boundary');
  const [,delim]: string[] = type.split('=');
  d(`delim: ${delim}`);
  const splitBody: string[] = body.split('\n').map(line => line.replace(/\r/g, ''));
  const keySplit: Array<string[]> = [];
  const cur: string[] = [];

  for (let i: number = 0; i < splitBody.length; i += 1) {
    const line: string = splitBody[i];
    d(line);
    if (line.includes(delim)) {
      if (cur.length) keySplit.push(clone(cur));
      cur.length = 0;
    } else {
      if (line.length) cur.push(line);
    }
  }

  const parsed: object = keySplit.map(pair => {
    const [unparsedKey, ...rest]: string[] = pair;
    const key: string = unparsedKey.replace('Content-Disposition: form-data; name=', '').replace(/"/g, '');
    return { [key]: rest.join() };
  }).reduce((acc, cur) => Object.assign(acc, cur), {});

  return parsed;
}
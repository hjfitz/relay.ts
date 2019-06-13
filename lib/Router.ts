import debug from 'debug'
import http from 'http'

import Response from './Response';
import Request from './Request';

let d = debug('relay:Router')

interface Middleware {
	func: Function;
	idx: Number;
  }
  

class Router {
	private mwCount: number;
	private middleware: any;
	base: string;
	all: Function;
	get: Function;
	head: Function;
	patch: Function ;
	options: Function;
	delete: Function;
	post: Function;
	put: Function;
	use: Function;
	d: debug.IDebugger;
	constructor() {
		d('router created')
		this.base = '/'
		this.mwCount = 0;
		this.d = debug('relay:Router')

		this.middleware = { GET: {}, HEAD: {}, OPTIONS: {}, POST: {}, PUT: {}, PATCH: {}, DELETE: {} };

		this.all = this.add.bind(this, '*');
		this.use = this.add.bind(this, '*');
		this.get = this.add.bind(this, 'GET');
		this.head = this.add.bind(this, 'HEAD');
		this.patch = this.add.bind(this, 'PATCH');
		this.options = this.add.bind(this, 'OPTIONS');
		this.delete = this.add.bind(this, 'DELETE');
		this.post = this.add.bind(this, 'POST');
		this.put = this.add.bind(this, 'PUT');	
	}

	// only use is debugging
	set baseUrl(newUrl: string) {
		d = debug(`relay:Router:${newUrl}`)
		d(`setting baseUrl to "${newUrl}"`)
		this.base = newUrl
	}

	get isRouter(): boolean {
		return true
	}

	handleReq(parsedReq: Request, res: http.ServerResponse, method: string, url: string) {
		const mws = this.middleware[method || 'GET'];
		const rawMws = mws[url || '*'] || mws['*'] || [];

		// shallow clone so resp has it's own queue
		const urlMws = [...rawMws];

		d(`queue size for ${url}: ${urlMws.length}`);

		// first funciton is used immediately
		const curMw: Middleware = urlMws.shift();

		const parsedRes: Response = new Response(res, parsedReq, urlMws);
		d('Request and Response parsed');

		if (!curMw || !curMw.func) return parsedRes.getNext();

		curMw.func(parsedReq, parsedRes, parsedRes.getNext);
	}

	  /**
   * clean this the fuck up
   */
  prepareMiddleware(): void {
    d('preparing midleware');
    const all = this.middleware['*'];

    // apply all '*' to each method
    // go through each verb we currently have
    if (all) {
      Object.keys(this.middleware).forEach((verb: string) => {
        if (verb === '*') return;
        const middlewares = this.middleware[verb];
      // go through each url on the middleware
        Object.keys(all).forEach((url: string) => {
          if (url in middlewares) middlewares[url].push(...all[url]);
          else middlewares[url] = [...all[url]];
        });
      });
    }
    d('round 1: apply all wildward (method) middleware to each route');

    // append wildcards to each url
    Object.keys(this.middleware).forEach((verb: string) => {
      const mwStack = this.middleware[verb];
      const wildcard = mwStack['*'];
      Object.keys(mwStack).forEach((url: string) => {
        if (url === '*') return;
        let curStack = mwStack[url];
        if (wildcard) curStack.push(...wildcard);
        curStack = curStack.sort((mw1: Middleware, mw2: Middleware) => {
          if (mw1.idx < mw2.idx) return -1;
          if (mw1.idx > mw2.idx) return 1;
          return 0;
        });
      });
	});

	d('round 2: apply all wildcard URLs')
	
	// finally, call prepare on all subrouters (where applicable)
	Object.keys(this.middleware).forEach((method: string) => {
		Object.keys(this.middleware[method]).forEach((url: string) => {
			this.middleware[method][url].forEach((middleware: any) => {
				if (middleware.func.isRouter) middleware.func.prepareMiddleware()
			})
		})
	})

	d('round 3: apply prepareMiddleware to subrouters')
    d('wildcards handled');
    d('middleware prepped');
    Object.freeze(this.middleware);
  }

	private addMw(method: string, url: string, middleware: Function|Router): Router {
		if (middleware instanceof Router) middleware.baseUrl = url
		const newWare = { func: middleware, idx: this.mwCount };

		// console.log(newWare)
	
		if (! (method in this.middleware)) this.middleware[method] = {};
		if (!(url in this.middleware[method])) this.middleware[method][url] = [newWare];
		else this.middleware[method][url].push(newWare);
	
		d(`${method} middleware for ${url} added`);
		this.mwCount += 1;
	
		return this;
	  }

	add(method: string, url: string|Function, middleware?: Function): Router {
		if (typeof url === 'string' && middleware) return this.addMw(method, url, middleware);
		if (url instanceof Function) return this.addMw(method, '*', url);
		throw new Error('should not get here');
	  }
}

export default Router
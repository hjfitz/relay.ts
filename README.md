# relay.ts
> Serve RESTFul APIs quickly and simply

## What?
This project is an abstraction over the builtin HTTP(s) module in Node. It aims to emulate the Express.js API, whilst being *very* performant and almost entirely dependency free.

Currently, this library is in very early stages and used more as a learning experience.

## How does this differ from Express?
Express is based on Connect, which has the simple concept of: all middleware goes on a central stack. The stack of middleware is traversed and checking verb/url.

In relay, the `.init()` method organises middle in to different stacks, accessed via an object with the URL as a key. Each URL sits under each verb, which is the key, too:

```js
this.middlewares = {
  'GET': {
    '/': [Middleware, Middleware],
    '/api': [Middleware, Middleware],
    '*': [Middleware]
  },
  'POST': {
    '/api': [Middleware]
  }
}
```

As you can guess, middleware lookup is O(1), not O(N) worst case. **PERF**

## Usage
Once this is published on npm, install it!

```zsh
yarn add ${libname}
```

Then, create a server!

```ts
import path from 'path';
import relay, { useStatic } from 'relay';

const server: Server = relay.createServer({ port: 8080 });

// you can use HTTP verbs, and use - just like express!
server.get('/', (req, res) => {
  res.send('hello, world');
});

// static file hosting built in:
server.get(useStatic(path.join(__dirname, 'static')));

// you can also chain!
server.get('/baz', (req, res, next) => {
  delete req._req;
  res.json(req);
})
.post('/', (req, res) => {
  res.send('oi')
});

// make sure to call .init, to create the server!
server.init().then(() => console.log('listening on 8080'));
```

## Roadmap:
- [x] Body parsing (form, json, urlencoded)
- [x] HTTP Verbs support
- [x] query param parsing
- [x] next() (very fucking difficult)
- [ ] cookie parsing (sort of works)
- [x] `use` middleware
- [x] Static files
- [ ] Compression (gzip + ???)
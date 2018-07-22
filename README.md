# TS Server
> Serve RESTFul APIs quickly and simply

## What?
This project is an abstraction over the builtin HTTP(s) module in Node. It aims to emulate the Express.js API, whilst being *very* performant.

Currently, this library is in very early stages and used more as a learning experience.

## Usage
Once this is published on npm, run `yarn add ${libname}`.

Then, create a server!

```ts
import libname from 'libname';

const server: Server = serv.createServer({
  port: 8080,
  plugins: [
    'body-parser', 
    'compression', 
    'cookie-parser', 
    'session',
    'logger',
  ],
  static: [{ dir: '/lib', on: '/mounted' }]
});

// you can use HTTP verbs, and use - just like express!
  .use((req, res, next) => {
    console.log('pure middleware!');
    next();
  })
  .get('/baz', (req, res, next) => {
    delete req._req;
    res.json(req);
  })
  .post('/', (req, res) => res.send('oi'))

// make sure to call .init, to create the server!
  .init(() => console.log('listening on 8080'));

```

## Why is this performant?
- to be added

## Features working:
- [x] Body parsing (by default)
- [x] HTTP Verbs
- [x] query param parsing
- [x] next()
- [ ] `use` middleware
- [ ] Static files
- [ ] cookie parsing - { credentials: 'include' }
- [ ] Compression (gzip + ???)
- [ ] sessions (consider binning this)
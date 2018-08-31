const serv = require('./dist');

const server = serv.createServer({
  port: 8080,
  plugins: [
    'body-parser', 
    'compression', 
    'cookie-parser', 
    'session',
    'logger',
  ],
  static: [{ dir: '/lib', on: '/mounted' }]
})
// todo: move to queue - change middlewares[verb]['*'] to Middleware[]
  .use((req, res, next) => {
    console.log('this shit invoked?');
    next();
  })
  .use((req, res) => {
    console.log('this also invoked??');
    res.send('yep');
  })
  .get('/', (req, res, next) => {
    console.log('passing 1')
    next();
  })
  .get('/', (req, res, next) => {
    console.log(next);
    console.log('passing 2')
    next();
  })
  .get('/', (req, res, next) => {
    delete req._req;
    res.json(req);
  })
  .get('/json', (req, res) => res.json({ a:1 }))
  .get('/file', (req, res) => res.sendFile('./package.json'))
  .post('/', (req, res) => res.send('oi'))
  .init(() => console.log('listening on 8080'));

  

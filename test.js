const serv = require('./dist');

const port = 8888;

const server = serv.createServer({
  port,
  plugins: [
    'body-parser', 
    'compression', 
    'cookie-parser', 
    'session',
    'logger',
  ],
  static: [{ dir: '/lib', on: '/mounted' }]
})
.use('/oioi', (req, res) => res.send('oi'))
// todo: move to queue - change middlewares[verb]['*'] to Middleware[]
.get('/', (req, res, next) => {
  delete req._req;
  res.json(req);
})
.use((req, res) => res.send('oi'))
.get('/json', (req, res) => res.json({ a:1 }))
.get('/file', (req, res) => res.sendFile('./package.json'))
.post('/', (req, res) => res.send('oi'))
.use('*', (req, res, next) => {
  console.log('this shit invoked?');
  next();
})
.use('/json', (req, res) => res.json({ a: 2}))
  .init(() => console.log('listening on', port));

  

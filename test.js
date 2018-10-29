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
  console.log('oi')
  console.log(next());
  // res.json(req);
})
.use((req, res, next) => next())
// .use((req, res) => res.send('its a me'))
.get('/json', (req, res) => res.json({ a:1 }))
.get('/test', (req, res) => res.end())
.get('/file', (req, res) => res.sendFile('./package.json'))
.post('/', (req, res) => res.send('oi'))
.use((req, res, next) => {
  console.log('this shit invoked?');
  next();
  res.send('last');
})
.use('/json', (req, res) => res.json({ a: 2}))
  .init(() => console.log('listening on', port));

  

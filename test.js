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
});

server
  .use((req, res, next) => {
    console.log(req.method);
    next();
  })
  .get('/', (req, res, next) => next())
  .get('/json', (req, res) => res.json({ a:1 }))
  .get('/file', (req, res) => res.sendFile('./package.json'))
  .post('/', (req, res) => res.send('oi'))
  .init(() => console.log('listening on 8080'));

  

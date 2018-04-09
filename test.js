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
  static: [{ dir: '/public', on: '/' }]
});

server
  .get('/', (req, res) => res.send('hi'))
  .get('/oioi', (req, res) => res.sendFile('../tsconfig.json'))
  .post('/', (req, res) => res.send('oi'))
  .init();

  
const serv = require('./dist');

const server = serv.createServer({
  port: 8080
});

server
  .get('/', (req, res) => res.send('hi'))
  .get('/oioi', (req, res) => res.sendFile('../tsconfig.json'))
  .post('/', (req, res) => res.send('oi'))
  .init();
// server.init();
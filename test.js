const serv = require('./dist');

const server = serv.createServer({
  port: 8080
});

server
  .get('/', (req, res) => res.send('hi'))
  .init();
// server.init();
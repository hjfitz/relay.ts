const serv = require('./dist');
console.log(serv);
const server = serv.createServer({
  port: 8080
});
server.init();
const { expect } = require('chai');
const axios = require('axios');

const port = 8080;

const base = axios.create({ baseURL: `http://localhost:${port}` })

const serv = require('../dist');
const app = serv.createServer({ port });

app.get('/', (_, res) => res.sendStatus(200));


app.init().then(test);

function test() {
describe('basic function', () => {
  it('should run on a given port', (done) => {  
    base.get('/').then(resp => {
      // console.log(resp.status);
      expect(resp.status).to.equal(200);
      done();
    });
  });

  describe('methods')
});
}
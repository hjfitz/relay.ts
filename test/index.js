const { expect } = require('chai');
const axios = require('axios');

const port = 8080;

const base = axios.create({ baseURL: `http://localhost:${port}` })

require('../dist').createServer({ port })
.get('/', (_, res) => res.sendStatus(200))
.post('/', (_, res) => res.sendStatus(200))
.put('/', (_, res) => res.sendStatus(200))
.head('/', (_, res) => res.sendStatus(200))
.options('/', (_, res) => res.sendStatus(200))
.patch('/', (_, res) => res.sendStatus(200))
.delete('/', (_, res) => res.sendStatus(200))
.init();

describe('Basic server functions', () => {
  it('should run on a given port', (done) => {  
    base.get('/').then(resp => {
      // console.log(resp.status);
      expect(resp.status).to.equal(200);
      done();
    });
  });

  it('should respond with a middleware not found, given that appropriate middleware is not added', (done) => {
    base.get('/foo').then(resp => {
      expect(resp.data).to.equal('unable to GET on /foo\n');
      done();
    });
  });
});

describe('Response to methods', () => {
  it('should respond to GET', (done) => {
    base.get('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });
  it('should respond to POST', (done) => {
    base.post('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });
  // head put patch delete options
  it('should respond to PUT', (done) => {
    base.put('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });
  it('should respond to HEAD', (done) => {
    base.head('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });
  it('should respond to PATCH', (done) => {
    base.patch('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });
  it('should respond to DELETE', (done) => {
    base.delete('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });
  it('should respond to OPTIONS', (done) => {
    base.options('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });
});

describe('server responses', () => {
  it('should send plaintext', (done) => {

  });

  it('should send json', (done) => {

  });

  it('should send files with correct headers', (done) => {

  });

  it('should send a status', (done) => {

  });

});

describe('request parsing', () => {
  it('should parse application/json', (done) => {

  });

  it('should parse x-www-form-urlencoded', (done) => {

  });

  it('should parse multipart/form-data', (done) => {

  });

  it('should parse queryStrings', (done) => {

  });
})

describe('next()', () => {
  it('should work after one pass', (done) => {

  })

  it('should work after multiple calls', (done) => {

  });

  it('should respond with nothing found if next is called and there is no more middleware', () => {

  });
});

describe('static hosting', () => {

});
const { expect } = require('chai');
const axios = require('axios');
const path = require('path');

const static = path.join(process.cwd(), 'test', 'static');

process.on('unhandledRejection', (r) => console.log(r))

const port = 8080;

const base = axios.create({ baseURL: `http://localhost:${port}` });

require('../dist').createServer({ port })
.get('/', (_, res) => res.sendStatus(200))
.post('/', (_, res) => res.sendStatus(200))
.put('/', (_, res) => res.sendStatus(200))
.head('/', (_, res) => res.sendStatus(200))
.options('/', (_, res) => res.sendStatus(200))
.patch('/', (_, res) => res.sendStatus(200))
.delete('/', (_, res) => res.sendStatus(200))
.get('/plaintext', (_, res) => res.sendFile(path.join(static, 'plain.txt')))
.get('/plaintext2', (_, res) => res.send('oioi laddo'))
.get('/json', (_, res) => res.json({ response: 'success' }))
.get('/css', (_, res) => res.sendFile(path.join(static, 'style.css')))
.get('/html', (_, res) => res.sendFile(path.join(static, 'index.html')))
.post('/json', (req, res) => {
  delete req._req;
  console.log(req);
  res.json(req.payload);
})
.init();

describe('Basic server functions', () => {
  it('should run on a given port', (done) => {  
    base.get('/').then(resp => {
      // console.log(resp.status);
      expect(resp.status).to.equal(200);
      done();
    });
  });

  it('should respond with a middleware not found, given that appropriate middleware is not added', async (done) => {
    let resp;
    try {
      resp = await base.get('/foo');
    } catch (err) {
      console.log(err);
      expect(err.resp.data).to.equal('unable to GET on /foo\n');
      
      done();
    }
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
    Promise.all([
      base.get('/plaintext'),
      base.get('/plaintext2'),
    ]).then(resp => resp.map(r => r.headers['content-type'])).then(types => {
      expect([...new Set(types)]).to.be.length(1);
      done();
    });
  });

  it('should send json', (done) => {
    base.get('/json').then(resp => {
      const { data } = resp;
      expect(Object.keys(data).length).to.equal(1);
      expect(data.response).to.equal('success');
      done();
    });
  });

  it('should send files with correct headers', async (done) => {
    const [{ headers: css }, { headers: html }] = await Promise.all([
      base.get('/css'),
      base.get('/html')
    ]);
    console.log(html['content-type']);
    // expect(css['content-type']).to.equal('text/css');
    expect(html['content-type']).to.equal('text/html');
    done();
  });

  it('should send a 200 status code for a found link', (done) => {
    base.post('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });

  it('should send a 404 status for a link that is not found', async (done) => {
    let resp;
    try {
      resp = await base.get('/notfound');
    } catch (err) {
      expect(resp.status).to.equal(404);
      done();
    }
  });
});

describe('request parsing', () => {
  it('should parse application/json', async (done) => {
    const resp = await base.post('/json', { test: 'success' });
    console.log(resp.data);
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
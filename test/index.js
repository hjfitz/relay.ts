const { expect } = require('chai');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');
const fs = require('fs');

const static = path.join(process.cwd(), 'test', 'static');

// process.on('unhandledRejection', (r) => console.log(r))

const port = 8080;

const base = axios.create({ baseURL: `http://localhost:${port}` });

base.interceptors.response.use(response => {
  return response;
}, error => {
  return error;
});

const relay = require('../dist')

const server = relay.createServer({ port });

const subrouter = new relay.Router();
const level2 = new relay.Router();


subrouter.get('/oi', (req, res) => {
	res.send('oi')
})

// subrouter.get(level2)

// level2.get('/level2', (req, res) => {
// 	res.send('made it to level 2')
// })

server
.use(relay.useStatic(path.join(__dirname, 'static')))
.get('/', (_, res) => res.sendStatus(200))
.post('/', (_, res) => res.sendStatus(200))
.put('/', (_, res) => res.sendStatus(200))
.head('/', (_, res) => res.sendStatus(200))
.options('/', (_, res) => res.sendStatus(200))
.patch('/', (_, res) => res.sendStatus(200))
.delete('/', (_, res) => res.sendStatus(200))
.get('/sub', subrouter)
.get('/plaintext', (_, res) => res.sendFile(path.join(static, 'plain.txt')))
.get('/plaintext2', (_, res) => res.send('oioi laddo'))
.get('/json', (_, res) => res.json({ response: 'success' }))
.get('/css', (_, res) => res.sendFile(path.join(static, 'style.css')))
.get('/html', (_, res) => res.sendFile(path.join(static, 'index.html')))
.post('/json', (req, res) => res.json(req.payload))
.post('/form', (req, res) => res.json(req.payload))
.get('/qs', (req, res) => res.json(req.query))
.get('/next1', (req, res, next) => next())
.get('/next1', (req, res) => res.send('next1'))
.get('/next3', (req, res, next) => next())
.get('/next3', (req, res, next) => next())
.use((req, res, next) => next())
.get('/next3', (req, res, next) => next())
.get('/next3', (req, res) => res.send('next3'))
.get('/nextNone', (req, res, next) => next())
.post('/empty', (req, res) => res.json(req.payload));

server.init();

describe('Basic server functions', () => {
  it('should run on a given port', (done) => {  
    base.get('/').then(resp => {
      // console.log(resp.status);
      expect(resp.status).to.equal(200);
      done();
    });
  });

  it('should respond with a 404, given that appropriate middleware is not added', (done) => {
      base.get('/foo').then(resp => {
        expect(resp.response.status).to.equal(404);
        expect(resp.response.data).to.equal('unable to GET on /foo\n');
        done();
      })
    
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

  it('should send files with correct headers', (done) => {
    Promise.all([
      base.get('/css'),
      base.get('/html')
    ]).then(( [{ headers: css }, { headers: html }]) => {
      expect(css['content-type']).to.equal('text/css');
      expect(html['content-type']).to.equal('text/html');
      done();
    });
  });

  it('should send a 200 status code for a found link', (done) => {
    base.post('/').then(resp => {
      expect(resp.status).to.equal(200);
      done();
    });
  });

  it('should send a 404 status for a link that is not found', (done) => {
    base.get('/notfound').then(resp => {
      expect(resp.response.status).to.equal(404);
      done();
    })
    
  });
});

describe('request parsing', () => {

  it('should have an empty request payload when no data is sent', (done) => {
    base.post('/empty').then(resp => {
      expect(JSON.stringify(resp.data)).to.equal('{}');
      done();
    });
  })
  it('should parse application/json', (done) => {
    base.post('/json', { test: 'success' }).then(resp => {
      expect(resp.data.test).to.equal('success');
      done();
    });
  });

  it('should parse x-www-form-urlencoded', (done) => {
    const requestBody = {
      type: 'form',
      test: 'success'
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
    
    base.post('/form', requestBody, config).then((resp) => {
      expect(JSON.stringify(resp.data)).to.equal(JSON.stringify(requestBody));
      done();
    });
  });

  it('should parse multipart/form-data', (done) => {
    const data = new FormData();
    data.append('test', 'success');
    data.append('type', 'form data');
    const headers = data.getHeaders();
    base.post('/form', data, { headers }).then(resp => {
      expect(JSON.stringify(resp.data)).to.equal(JSON.stringify({ test: 'success', type: 'form data' }));
      done();
    });
  });

  it('should parse queryStrings', (done) => {
    base.get('/qs?test=success&type=form%20data').then(resp => {
      expect(JSON.stringify(resp.data)).to.equal(JSON.stringify({ test: 'success', type: 'form data' }));
      done();
    })
  });
});

describe('next()', () => {
  it('should work after one pass', (done) => {
    base.get('/next1').then(resp => {
      expect(resp.data).to.equal('next1\n');
      done();
    })
  })

  it('should work after multiple calls', (done) => {
    base.get('/next3').then(resp => {
      expect(resp.data).to.equal('next3\n');
      done();
    })
  });

  it('should respond with nothing found if next is called and there is no more middleware', (done) => {
    base.get('/nextNone').then(resp => {
      expect(resp.response.data).to.equal('unable to GET on /nextNone\n');
      expect(resp.response.status).to.equal(404);
      done();
    })
  });
});

describe('static hosting', () => {
  it('should send index.html', (done) => {
    base.get('/index.html').then(resp => {
      expect(resp.headers['content-type']).to.equal('text/html');
      expect(resp.data).to.equal(fs.readFileSync(path.join(__dirname, 'static', 'index.html')).toString() + '\n');
      done();
    })
  });

  it('should send some CSS', (done) => {
    base.get('/style.css').then(resp => {
      expect(resp.headers['content-type']).to.equal('text/css');
      expect(resp.data).to.equal(fs.readFileSync(path.join(__dirname, 'static', 'style.css')).toString() + '\n');
      done();
    });
  });

  it('should send some javascript', (done) => {
    base.get('/main.js').then(resp => {
      expect(resp.headers['content-type']).to.equal('application/javascript');
      expect(resp.data).to.equal(fs.readFileSync(path.join(__dirname, 'static', 'main.js')).toString() + '\n');
      done();
    });
  });

  it('should respond with a 404', (done) => {
    base.get('/jquery.min.js').then(resp => {
      expect(resp.response.status).to.equal(404);
      done();
    })
  });
});

describe('subrouters', () => {
	it('should handle one subrouter', (done) => {
		base.get('/sub/oi').then((data) => {
			console.log(data)
			done()
		})
	})

	it('should handle nested subrouters', (done) => {

	})
})
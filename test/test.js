const relay = require('./dist');
const path = require('path');
console.log(relay);

const port = 8888;

const app = relay.default({ port });

app.use('/oioi', (req, res) => res.send('oi'));

app.use(relay.useStatic(path.join(__dirname, 'static')));

app.get('/', (req, res, next) => {
  console.log('oi');
  // next();
  res.json({ oi: 'oi'});
})

app.use((req, res, next) => {
  console.log('second')
  next();
})

app.get('/json', (req, res) => res.json({ a:1 }))

app.get('/test', (req, res) => res.end())

app.get('/file', (req, res) => res.sendFile('./package.json'))

app.post('/', (req, res) => res.send('oi'))

app.use('/', (req, res, next) => {
  console.log('this shit invoked?');
  // next();
  res.send('last');
})

app.use('/json', (req, res) => res.json({ a: 2}))

app.init().then(() => console.log('listening on', port));

  

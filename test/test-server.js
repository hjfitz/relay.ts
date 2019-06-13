const relay = require('../dist');
const path = require('path');
console.log(relay);

const port = 8888;

const app = relay.createServer({ port });

const router = new relay.Router();

const subsubrouter = new relay.Router();

app.use('/oioi', (req, res) => res.send('oi'));

app.get('/router/wee', (req, res) => {
	res.send('tricky one')
})
app.get('/router', router)



router.get('/oi', (req, res) => {
	console.log('/router/oi')
	res.send('yas')
})

subsubrouter.get('/oi', (req, res) => {
	res.send('oioi')
})

router.use('/subrouter', subsubrouter)

router.get('/router', (req, res) => {
	res.send('router works innit')
})

const static = path.join(__dirname, 'static');

app.use(relay.useStatic(static));

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

  

# TS Server
> Serve Restful APIs with PERF and reliability

Absolutely micro abstraction over node's HTTP{S,} modules

Features working:
- [x] Body parsing (by default)
  - ~~JSON (x)~~
  - ~~forms (partially)~~
- [x] HTTP Verbs
- [ ] cookie parsing - { credentials: 'include' }
- [ ] `use` middleware
- [ ] Static files
- [ ] next()
  - works for HTTP verbs - app.use is broken
- [ ] Compression (gzip + ???)
- [ ] sessions (consider binning this)
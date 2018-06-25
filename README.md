# TS Server
> Serve Restful APIs with PERF and reliability

Absolutely micro abstraction over node's HTTP{S,} modules

Features working:
- [ ] Static files
- [x] HTTP Verbs
- [ ] `use` middleware
- [ ] next()
  - works for HTTP verbs - app.use is broken
- [ ] Compression (gzip + ???)
- [x] ~~Body parsing (by default)~~
  - ~~JSON (x)~~
  - ~~forms (partially)~~
- [ ] cookie parsing - { credentials: 'include' }
- [ ] sessions (consider binning this)
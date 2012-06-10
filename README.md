# Skynet as a Service

## Deployment

### Initial Setup

```bash
$ git clone https://github.com/obfuscurity/skynet.git
$ cd skynet
$ heroku create -s cedar --buildpack heroku config:add BUILDPACK_URL=https://github.com/ddollar/heroku-buildpack-multi.git sky-net-multi
$ heroku addons:add redistogo -a sky-net-multi
$ heroku addons:add heroku-postgresql:dev -a sky-net-multi
```

### Local

```bash
$ export RACK_ENV=development
$ export S3_BUCKET=skynet-mr
$ export S3_KEY=...
$ export S3_SECRET=...
$ export HEROKU_API_SCALING_URL=https://api.heroku.com/apps/sky-net-multi/ps/scale
$ foreman start
```

### Platform

```bash
$ heroku config:add -a sky-net-web RACK_ENV=production
$ heroku config:add -a sky-net-web S3_BUCKET=skynet-mr
$ heroku config:add -a sky-net-web S3_KEY=...
$ heroku config:add -a sky-net-web S3_SECRET=...
$ export HEROKU_API_SCALING_URL=https://api.heroku.com/apps/sky-net-multi/ps/scale
$ heroku ps:scale web=1 splitter=1 scheduler=1 -a sky-net-web
```


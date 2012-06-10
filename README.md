# Skynet as a Service

## Deployment

### Initial Setup

```bash
$ heroku create -s cedar sky-net-web
$ heroku addons:add redistogo -a sky-net-web
$ heroku addons:add heroku-postgresql:dev -a sky-net-web
$ heroku create -s cedar sky-net-worker
$ heroku create -s cedar sky-net-splitter
$ heroku create -s cedar sky-net-scheduler
```

### Local

#### Web

```bash
$ export BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-ruby.git
$ export DATABASE_URL=...
$ export RACK_ENV=development
$ export REDISTOGO_URL=...
$ export S3_BUCKET=skynet-mr
$ export S3_KEY=...
$ export S3_SECRET=...
$ foreman start web
```

#### Worker

```bash
$ export BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-nodejs.git
$ export DATABASE_URL=...
$ export REDISTOGO_URL=...
$ export S3_BUCKET=skynet-mr
$ export S3_KEY=...
$ export S3_SECRET=...
$ foreman start worker
```

#### Splitter

```bash
$ export BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-nodejs.git
$ export DATABASE_URL=...
$ export REDISTOGO_URL=...
$ export S3_BUCKET=skynet-mr
$ export S3_KEY=...
$ export S3_SECRET=...
$ foreman start splitter
```

#### Scheduler

```bash
$ export BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-nodejs.git
$ export DATABASE_URL=...
$ export HEROKU_API_SCALING_URL=https://api.heroku.com/apps/sky-net-worker/ps/scale
$ export REDISTOGO_URL=...
$ export S3_BUCKET=skynet-mr
$ export S3_KEY=...
$ export S3_SECRET=...
$ foreman start scheduler
```

### Platform

#### Web

```bash
$ heroku config:add -a sky-net-web BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-ruby.git
$ heroku config:add -a sky-net-web RACK_ENV=development
$ heroku config:add -a sky-net-web S3_BUCKET=skynet-mr
$ heroku config:add -a sky-net-web S3_KEY=...
$ heroku config:add -a sky-net-web S3_SECRET=...
$ heroku ps:scale web=1 -a sky-net-web
```

#### Worker

```bash
$ heroku config:add -a sky-net-worker BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-nodejs.git
$ heroku config:add -a sky-net-worker DATABASE_URL=...
$ heroku config:add -a sky-net-worker REDISTOGO_URL=...
$ heroku config:add -a sky-net-worker S3_BUCKET=skynet-mr
$ heroku config:add -a sky-net-worker S3_KEY=...
$ heroku config:add -a sky-net-worker S3_SECRET=...
$ heroku ps:scale worker=1 -a sky-net-worker
```

#### Splitter

```bash
$ heroku config:add -a sky-net-splitter BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-nodejs.git
$ heroku config:add -a sky-net-splitter DATABASE_URL=...
$ heroku config:add -a sky-net-splitter REDISTOGO_URL=...
$ heroku config:add -a sky-net-splitter S3_BUCKET=skynet-mr
$ heroku config:add -a sky-net-splitter S3_KEY=...
$ heroku config:add -a sky-net-splitter S3_SECRET=...
$ heroku ps:scale splitter=1 -a sky-net-splitter
```

#### Scheduler

```bash
$ heroku config:add -a sky-net-scheduler BUILDPACK_URL=http://github.com/heroku/heroku-buildpack-nodejs.git
$ heroku config:add -a sky-net-scheduler DATABASE_URL=...
$ heroku config:add -a sky-net-scheduler HEROKU_API_SCALING_URL=https://api.heroku.com/apps/sky-net-worker/ps/scale
$ heroku config:add -a sky-net-scheduler REDISTOGO_URL=...
$ heroku config:add -a sky-net-scheduler S3_BUCKET=skynet-mr
$ heroku config:add -a sky-net-scheduler S3_KEY=...
$ heroku config:add -a sky-net-scheduler S3_SECRET=...
$ heroku ps:scale scheduler=1 -a sky-net-scheduler
```


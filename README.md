# Skynet as a Service

Skynet, the main antagonist in the Terminator franchise, is a fictional artificial intelligence system which becomes self-aware and decides to terminate humanity, its creators. Skynet is rarely seen onscreen, with its actions often performed via robots, cyborgs (usually a Terminator), and other computer systems.

Skynet, the [Baltimore Hackathon](http://baltimorehackathon.com/) antagonist, is a proof-of-concept application for applying concepts in Parallel Computing to the Cloud Computing deployment and provisioning model. Customer jobs can be submitted through Skynet's state-of-the-art (for 1980's-era entertainment) interface, split up equally across a customer-requested number of processing nodes, sorted, reduced, and aggregated for the final result.

## Deployment

In order to simplify deployment we're making use of David Dollar's excellent [heroku-buildpack-multi](https://github.com/ddollar/heroku-buildpack-multi) project. This allows you to run concurrent Heroku processes using ddifferent languages/buildpacks.

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


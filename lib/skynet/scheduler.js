/*
 * Copyright © 2012 Devon H. O'Dell.
 *
 * All rights reserved.
 *
 * This is proprietary source code. Permission to use or redistribute this
 * code in any form, with or without modifications, is not granted without
 * express written, notarized permission of the author and copyright holders.
 */

var https = require('https'),
    pg = require('pg'),
    qs = require('querystring'),
    redis = require('redis'),
    s3 = require('knox'),
    url = require('url');

var pubClient = redis.createClient(process.env.RTG_PORT, process.env.RTG_HOST);
pubClient.auth(process.env.RTG_PASS);

var subClient = redis.createClient(process.env.RTG_PORT, process.env.RTG_HOST);
subClient.auth(process.env.RTG_PASS);

var pgConnStr = 'tcp://' + process.env.DATABASE_URL.substr(11);

var job = {};
var db;

pg.connect(pgConnStr, function (err, client) {
  if (err != null) {
    console.log('Error connecting to Postgres: ' + err);
    throw err;
  }

  db = client;
  console.log('running query');
  db.query('select * from jobs j left join workers w on w.job_id = j.id where w.job_id is null limit 1', function (err, res) {
    if (err != null) {
      console.log('Error retrieving jobs: ' + err);
    }

    console.log('query returned: ' + res);
    job = res;
  });
});

var splitFiles = [],
    splitters = {},
    workers = {};

var scalingParts = url.parse(process.env.HEROKU_API_SCALING_URL);

var authOpts = {
  host: scalingParts.host,
  port: 443,
  path: '/apps',
  method: 'GET',
  headers: {
    Authorization: new Buffer('dhobsd:1fef235a8fa2a5dcf5775deafee9f6e48fed7f7a').toString('base64'),
    Accept: 'application/json'
  }
};

var req = https.request(authOpts, function (res) {});
req.end();

var scaleWorkers = function (type, n) {
  console.log('scaleWorkers');
  var postData = qs.stringify({
    type: type,
    qty: n
  });

  var postOpts = {
    host: scalingParts.host,
    port: 443,
    path: scalingParts.path,
    method: 'POST',
    headers: {  
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',  
      'Content-Length': postData.length  
    }
  };

  req = https.request(postOpts, function (res) {
    res.on('data', function (chunk) {
      console.log('Buffer: ' + chunk.toString());
    });
  });

  req.write(postData);
  req.end();
}

scaleWorkers('splitter', 1)

var done = 0;

subClient.on('message', function (channel, message) {
  var data;
  try {
    data = JSON.parse(message);
  } catch (e) {
    console.log('Can\'t parse JSON for scheduler message: ' + e);
    throw e;
  }

  if (channel == 'scheduler') {
    if (data.workerId != undefined) {
      if (workers[data.workerId] == undefined) {
        workers[data.workerId] = {
          stage: 'map',
          progress: 0
        };

        db.query('insert into workers (uuid, type, state, progress, created_at, updated_at, job_id) values ($1, $2, $3, $4, $5, $6, $7)',
          [ data.workerId, 'mapper', 'working', 0, 'NOW()', 'NOW()', job.id ]);

        subClient.subscribe(data.workerId);
      }
    } else if (data.splitterId != undefined) {
      if (splitters[data.splitterId] == undefined) {
        splitters[data.splitterId] = {
          stage: 'split',
          progress: 0
        };

        db.query('insert into workers (uuid, type, state, progress, created_at, updated_at, job_id) values ($1, $2, $3, $4, $5, $6, $7)',
          [ data.splitterId, 'splitter', 'working', 0, 'NOW()', 'NOW()', job.id ]);

        subClient.subscribe(data.splitterId);
        pubClient.publish(data.splitterId, JSON.stringify({
          dataFile: job.data_url,
          dataLength: 100, /* XXX */
          jobId: job.id,
          workerCount: job.nodes
        }));
      }
    }
  } else if (splitters[channel] != undefined) {
    if (data.splitFiles != undefined) {
      splitFiles = data.splitFiles;
      scaleWorkers('worker', job.nodes);
      splitters = {};
    } else if (data.progress != undefined) {
      if (data.progress < 100) {
        db.query('update workers set progress=$1, updated_at=now() where uuid=$2 and job_id=$3 and type=$4',
          [ data.progress, channel, job.id, 'splitter' ]);
      } else {
        db.query('update workers set progress=$1, state=$2, updated_at=now() where uuid=$3 and job_id=$4 and type=$4',
          [ data.progress, 'done', channel, job.id, 'splitter' ]);
      }
    }
  } else if (workers[channel] != undefined) {
    if (data.imFiles != undefined) {
      done++;
      imFiles.push(data.imFiles);

      var i = 0;
      if (done == job.nodes) {
        for (var worker in workers) {
          pubClient.publish(worker, {
            code: job.reducer_code,
            dataFile: imFiles[i][0],
            dataLength: 100, /* XXX */
            jobType: 'reduce',
            jobId: job.id,
            workerCount: job.nodes,
            workerNumber: i++,
          });
        }

        done = 0;
      }
    } else if (data.progress != undefined) {
      if (data.progress < 100) {
        if (workers[channel].stage == 'map') {
          db.query('update workers set progress=$1, updated_at=now() where uuid=$2 and job_id=$3 and type=$5',
            [ data.progress, channel, job.id, 'mapper' ]);
        } else {
          db.query('update workers set progress=$1, updated_at=now() where uuid=$2 and job_id=$3 and type=$5',
            [ data.progress, channel, job.id, 'reducer' ]);
        }
      } else {
        if (workers[channel].stage == 'map') {
          workers[channel].stage = 'reduce';

          db.query('update workers set progress=$1, state=$2, updated_at=now() where uuid=$3 and job_id=$4 and type=$5',
            [ data.progress, 'done', channel, job.id, 'mapper' ]);

          db.query('insert into workers (uuid, type, state, progress, created_at, updated_at, job_id) values ($1, $2, $3, $4, $5, $6, $7)',
            [ channel, 'reducer', 'working', 0, 'NOW()', 'NOW()', job.id ]);
        } else {
          db.query('update workers set progress=$1, state=$2, updated_at=now() where uuid=$3 and job_id=$4 and type=$5',
            [ data.progress, 'done', channel, job.id, 'reducer' ]);

          if (++done == job.nodes) {
            scaleWorkers(0);
          }
        }
      }
    }
  }
});

subClient.subscribe('scheduler');

/* vim:ft=javascript:ts=2:sw=2:et
 * */

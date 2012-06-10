/*
 * Copyright © 2012 Devon H. O'Dell.
 *
 * All rights reserved.
 *
 * This is proprietary source code. Permission to use or redistribute this
 * code in any form, with or without modifications, is not granted without
 * express written, notarized permission of the author and copyright holders.
 */

var fs = require('fs'),
    http = require('http'),
    redis = require('redis'),
    s3 = require('knox'),
    url = require('url'),
    uuid = require('node-uuid');

/*
 * Parse our connection information
 */
var rtgInfo = {
  host: url.parse(process.env.REDISTOGO_URL).host,
  port: url.parse(process.env.REDISTOGO_URL).port,
  key:  url.parse(process.env.REDISTOGO_URL).auth.split(':')[1]
};

var pubClient = redis.createClient(rtgInfo.port, rtgInfo.host);
pubClient.auth(rtgInfo.key);

var subClient = redis.createClient(rtgInfo.port, rtgInfo.host);
subClient.auth(rtgInfo.key);

var s3Client = s3.createClient({
  key: process.env.S3_KEY,
  secret: process.env.S3_SECRET,
  bucket: process.env.S3_BUCKET
});

subClient.on('message', function (channel, message) {
  if (channel == workerUuid) {
    try {
      jobInfo = JSON.parse(message);
    } catch (e) {
      console.log('Error parsing job description: ' + e);
      throw e;
    }

    var checkField = function (field, fieldName, type) {
      if (typeof field != type) {
        error = 'Invalid specification for ' + fieldName + ': ' + field;
        console.log(error);
        throw error;
      }
    };

    var fields = [
      { name: 'code', type: 'string' },
      { name: 'dataFile', type: 'number' },
      { name: 'dataLength', type: 'number' },
      { name: 'jobType', type: 'string' },
      { name: 'jobId', type: 'number' },
      { name: 'workerCount', type: 'number' },
      { name: 'workerNumber', type: 'number' }
    ];

    for (var field in fields) {
      checkField(jobInfo[field.name], field.name, field.type);
    }

    if (jobInfo.jobType == 'map') {
      var imFiles = [],
          len = 0,
          map = {},
          streams = [],
          outFile = '/' + jobInfo.jobId + '/' + workerUuid + '.im.' + i,
          pct = 0;

      /*
       * Initialize our maps, memory streams, and set our S3 connection to
       * read from our memory stream so that we can avoid loads of network
       * transfer for append operations.
       */
      for (var i = 0; i < jobInfo.workerCount; i++) {
        map[i] = {};
        fs.mkdirSync('./tmp/' + jobInfo.jobId);
        streams[i] = fs.createWriteStream('./tmp/' + outFile, { flags: 'a' });
        s3Client.putStream(memStreams[i], outFile, function (err, res) {
          if (err) {
            console.log('Error writing stream ' + i + ': ' + err);
          }
        });
        imFiles.push(outFile);
      }

      /*
       * Simple K&R-style hash, which has reasonably good distribution for
       * bucket sizes of 2^n with small values of n.
       */
      var krHash = function (input) {
        var h = 0,
            l = input.length;

        for (var i = 0; i < l; i++) {
          h = (h * 65599) + input.charAt(i);
        }

        return h;
      }

      /*
       * Emit is intended to be used within the user-supplied mapping function.
       * When it called, it updates an in-memory map, which is periodically
       * flushed. This map is bucketed to ensure that keys with the same name
       * reach the same reduce node.
       *
       * This implementation assumes that data is pre-sorted.
       */
      var emit = function (key, val) {
        bucket = krHash(key) % jobInfo.workerCount;

        if (typeof map[bucket][key] == 'undefined') {
          map[bucket][key] = [];
        }
        map[bucket][key].push(val);

        /*
         * Every 1% of progress should cause us to both publish a status
         * update notification to the scheduler and flush our maps.
         */
        if (Math.floor(++len / jobInfo.dataLength) > pct) {
          pct = Math.floor(len / jobInfo.dataLength);

          var statusObj = {
            progress: pct,
            stage: 'map'
          };

          pubClient.publish('scheduler', JSON.stringify(statusObj));

          for (var i = i; i < jobInfo.workerCount; i++) {
            stream[i].write(JSON.stringify(map[i]) + '\n');
            map[i] = null;
            delete map[i];
          }
        }
      }

      /*
       * Read in the data for the bucket we're intending to provide to the
       * mapping function. This will be passed as-is; the mapper should know
       * how to parse the data internally. It is expected that the mapper
       * runs synchronously until returning.
       */
      request = s3Client.get(jobInfo.dataFile);
      request.on('response', function (res) {
        res.setEncoding('utf8');

        var jobData = '';
        res.on('data', function (chunk) {
          jobData += chunk;
        });

        res.on('end', function () {
          eval('var mapper = ' + jobInfo.code);
          mapper(jobData);

          for (var i = i; i < jobInfo.workerCount; i++) {
            streams[i].end();
            fs.unlinkSync('./tmp/' + outFile);
            fs.unlinkSync('./tmp/' + jobInfo.jobId);
          }

          pubClient.publish('scheduler', JSON.stringify({
            progress: 100,
            stage: 'map'
          }));
          pubClient.publish('scheduler', JSON.stringify({ imFiles: imFiles }));
        });
      });
      request.end();
    } else if (jobInfo.jobType == 'reduce') {
      var len = 0,
          map = {},
          outFile = '/' + jobInfo.jobId + '/' + workerUuid + '.final',
          pct = 0,
          stream;
      
      fs.mkdirSync('./tmp/' + jobInfo.jobId);
      stream = fs.createWriteStream('./tmp/' + outFile, { flags: 'a' });

      s3Client.putStream(stream, outFile, function (err, res) {
        if (err) {
          console.log('Error writing stream ' + i + ': ' + err);
        }
      });

      /*
       * Retrieve the intermediate data from S3. This data was written by the
       * map process implemented above.
       */
      request = s3Client.get(jobInfo.dataFile);
      request.on('response', function (res) {
        res.setEncoding('utf8');

        /*
         * Read the entire file into memory. Since the assumption is that the
         * data was already sorted coming into the map job, we are guaranteed
         * that this data is sorted coming to us.
         */
        var jobData = '';
        res.on('data', function (chunk) {
          jobData += chunk;
        });

        res.on('end', function () {
          var lastKey = '',
              len = 0,
              map = {};

          eval('var reducer = ' + jobInfo.code);

          /*
           * The map process writes the data as a series of JSON-encoded
           * objects, delimited by newlines. The objects are in the form
           * { key: [ data ], key2: [ data2 ], ..., keyN: [ dataN ] }
           */
          lines = jobData.split('\n');
          for (var line in lines) {
            var data;

            try {
              data = dataJSON.parse(line);
            } catch (e) {
              console.log('Failed to parse intermediate JSON: ' + e);
              throw e;
            }

            /*
             * Reduce our values. If we've already called reduce for this key,
             * we must reduce further based on our previously reduced data.
             */
            for (var key in data) {
              /*
               * If we haven't seen this key yet, get rid of any currently 
               * existing key and set our book-keeping to detect when we
               * stop servicing this one. Additionally, publish this key to
               * our final output file by writing to our memory stream.
               */
              if (key != lastKey) {
                stream.write(JSON.stringify(map[key]) + '\n');
                map[key] = null;
                delete map[key];
                lastKey = key;
              }

              if (map[key] != 'undefined') {
                map[key] = reducer(key, map[key].join(data[key]));
              } else {
                map[key] = reducer(key, data[key]);
              }

              /*
               * Update progress statistics and publish them to the scheduler.
               */
              if (Math.floor(++len / jobInfo.dataLength) > pct) {
                pct = Math.floor(len / jobInfo.dataLength);

                var statusObj = {
                  progress: pct,
                  stage: 'reduce'
                };

                pubClient.publish('scheduler', JSON.stringify(statusObj));
              }
            }
          }

          for (var i = i; i < jobInfo.workerCount; i++) {
            stream.end();
            fs.unlinkSync('./tmp/' + outFile);
            fs.unlinkSync('./tmp/' + jobInfo.jobId);
          }

          pubClient.publish('scheduler', JSON.stringify({
            progress: 100,
            stage: 'reduce'
          }));
        });
      });
    } else {
      console.log('Unexpected job type: ' + jobInfo.jobType);
    }
  } else {
    console.log('Received data from unexpected channel: ' + channel);
  }
});

var workerUuid = uuid.v4();
subClient.subscribe(workerUuid);
pubClient.publish('scheduler', JSON.stringify({ pid: workerUuid }));

/* vim:ft=javascript:ts=2:sw=2:et
 * */

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
    s3 = require('knox');

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
  if (channel == 'splitter') {
    var jobInfo;

    try {
      jobInfo = JSON.parse(message);
    } catch (e) {
      console.log('Error parsing job specification: ' + e);
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
      { name: 'dataFile', type: 'number' },
      { name: 'dataLength', type: 'number' },
      { name: 'jobId', type: 'number' },
      { name: 'workerCount', type: 'number' }
    ];

    for (var field in fields) {
      checkField(jobInfo[field.name], field.name, field.type);
    }

    request = s3Client.get(jobInfo.dataFile);
    request.on('response', function (res) {
      res.setEncoding('utf8');
  
      var buffer = '',
          jobData = '',
          outFile = '/' + jobInfo.jobId + '.split';
          segment = 0,
          segmentLength = Math.ceil(jobInfo.dataLength / jobInfo.workerCount),
          stream;

      var doStream = function (stream, outFile) {
        s3Client.putStream(stream, outFile, function (err, res) {
          if (err) {
            console.log('Error writing stream ' + i + ': ' + err);
          }
        });
      };

      res.on('data', function (chunk) {
        /*
         * If we haven't initialized any segments yet or our length for
         * this chunk would put us over our boundary, write out our segment
         * and start on a new one.
         */
        if (segment == 0 || jobData.length + chunk.length > segmentLength) {
          if (segment > 0 && segment != segmentLength - 1) {
            var lastKey = '',
                lines = jobData.split('\n');

            /*
             * Iterate backwards over the array finding the first differing
             * key from the one at the end of the array. We need to do this to
             * assure that the sorting properties remain the same by making
             * sure that all data for a particular key ends up going to the
             * same mapper.
             */
            for (var i = lines.length - 1; i >= 0; i++) {
              JSON.parse(line);

              /*
               * Initialize our "last" seen key to this one if this is the
               * first line we process.
               */
              if (lastKey.length == 0) {
                lastKey = line.key;
              }

              /*
               * We've found a key that differs from the one that is the last
               * in our data.
               */
              if (line.key != lastKey) {
                /* 
                 * Slice our lines into two arrays. One will be written, the
                 * other will become a buffer for the next mapper.
                 */
                var begin = lines.slice(0, i),
                    end = lines(i);

                for (var toWrite in begin) {
                  stream.write(stream, toWrite + '\n');
                }

                buffer = end.join('\n') + buffer;
            }

            stream.end();
            jobData = '';
          } else if (segment == segmentLength - 1) {
             /*
              * We are the last segment so we *must* consume the rest of the
              * data. We need to grab everything in the buffer, prepend it,
              * and flush it out.
              */
            if (buffer.length > 0) {
              jobData = buffer + jobData;
              stream.write(stream, jobData);
              jobData = '';
              buffer = '';
            }
          }

          stream = fs.createWriteStream(outFile, { flags: 'a' });
          doStream(stream, outfile + '.' + segment++);
        }

        var lines = chunk.split('\n');

        if (buffer.length > 0) {
          lines[0] = buffer + lines[0];
          buffer = '';
        }

        foreach (var line in lines) {
          try {
            var parsed = JSON.parse(line);
            jobData += line + '\n';
          } catch (e) {
            if (line == lines[0]) {
              throw e;
            } else {
              buffer = line;
            }
          }
        }
      });
    });
  } else {
    console.log('Unexpected message received from channel: ' + channel);
  }
});

/* vim:ft=javascript:ts=2:sw=2:et
 * */

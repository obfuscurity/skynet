web: bundle exec rackup -p $PORT -s thin
splitter: bundle exec rake queue:splitter VERBOSE=1 QUEUE=splitter
mrworker: node lib/skynet/worker.js

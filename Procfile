web: bundle exec rackup -p $PORT -s thin
splitter: bundle exec rake queue:data VERBOSE=1 QUEUE=data
worker: bundle exec rake queue:jobs VERBOSE=1 QUEUE=jobs

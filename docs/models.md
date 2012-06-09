
# Models

## Users

* id
* email
* password

## Jobs

* id
* user_id
* mapper_code
* reducer_code
* data_url

## Workers

* id
* job_id
* uuid - provided by process
* type - mapper, reducer, splitter
* state - starting, idling, working, finished
* progress


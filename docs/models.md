
# Models

## Users

* id
* email
* password
* created_at
* updated_at

## Jobs

* id
* user_id
* nodes
* mapper_code
* reducer_code
* data_url
* created_at
* updated_at

## Workers

* id
* job_id
* uuid - provided by process
* type - mapper, reducer, splitter
* state - starting, idling, working, finished
* progress
* created_at
* updated_at


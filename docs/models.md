
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
* type - mapper, reducer, splitter

## Tasks

* id
* job_id
* worker_id
* state
* progress


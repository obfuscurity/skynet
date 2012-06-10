# Formats

## Queues

* splitter - split tasks
* scheduler - map and reduce tasks

## Tasks

### Splits

```json
{
  uri: 'httpPathSpec'
}
```

### Map / Reduce Workers

Job Information:

```json
{
  code: 'function () { ... }',
  dataFile: 'pathToFileInS3',
  dataLength: numRecordsInDataFile,
  jobType: ( 'map' | 'reduce' ),
  jobId: 12345,
  workerCount: 16,
  workerNumber: 12
}
```
Pro

## Job Status

```json
[
  {
    "id": 3,
    "nodes": 10,
    "mapper_code": "foo",
    "reducer_code": "bar",
    "data_url": "baz",
    "created_at": "2012-06-10 01:24:33 -0400",
    "updated_at": "2012-06-10 01:24:33 -0400",
    "workers": [
      {
        "id": 1,
        "uuid": "109156be-c4fb-41ea-b1b4-efe1671c5836",
        "type": "mapper",
        "status": "working",
        "progress": "70"
        "created_at": "2012-06-10 05:59:29 -0400",
        "updated_at": "2012-06-10 05:59:29 -0400",
        "job_id": 99,
      },
      ...
    ]
  }
]
```


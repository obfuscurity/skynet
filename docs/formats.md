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
    id: 1,
    job_id: 99,
    uuid: "109156be-c4fb-41ea-b1b4-efe1671c5836",
    type: "mapper",
    status: "working",
    progress: "70"
  },
  ...
]
```


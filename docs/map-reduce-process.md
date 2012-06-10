# Map Reduce Process

## Overview

The moniker "map / reduce" is somewhat a misnomer: this algorithm for solving
embarassingly parallel problems is far more complex than its name implies.
Generally, the complexity behind such problems is forgotten as most of the
process is hidden from the developer consuming the API. This document explains
the process of performing a parallel map / reduce, the implementation we take
for this implemenation, and future directions.

## Process

Generally, the process of mapping and reducing data is completed via the
following steps:

 1. Data is split into `M` different partitions. `M` corresponds with the
    number of configured mapping jobs.
 2. `M` mapping jobs are spawned and provided a means to access their
    corresponding data partition.
 3. Each mapping job traverses its list of data, parsing it into key / value
    pairs.
 4. Each key / value pair is passed into a user-supplied "mapping" function.
    This function is responsible for analyzing the key and value, and
    determining an action to take: it either ignores the data, or emits it
    into an intermediary form (in this case, an in-memory object).
 5. Periodically, this object is flushed to one of `R` files in a permanent
    data storage system. The value `R` signifies the number of configured
    reducing jobs. The flush is done via a partitioning mechanism, ensuring
    that:

    a) the cardinality of each data set is statistically even, and
    b) equivalent keys are always destined for the same reducer.

    The easiest way to provide these two guarantees is to apply an
    evenly-distributed hash function to each key and modulo the result into `R`
    buckets. Each bucket represents an intermediate output file.
 6. As soon as map jobs complete, their intermediary data is made available for
    consumption via the intermediary files constructed in step 5; `R` reducer
    jobs are spawned.
 7. Reducers read data from intermediary files. This data is merge-sorted into
    a new file, which is then analyzed and passed to the user-supplied reduce
    function. In the case that multiple lists exist for the same key, this
    function is called multiple times.
 8. The user-supplied reduce function emits its aggregate results for a
    particular key and associated list of values.
 9. When a new key is found, the final reduced value is written to an output
    file.

After this process, a concatenation of the output files contains the final
result of the map / reduce algorithm.


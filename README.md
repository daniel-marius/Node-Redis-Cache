## Redis Cache Layer to Mongoose in Node.js

## What does it mean a cache layer?

- Cache is a high-speed data storage layer which stores a subset of data, so that future requests for that data are served up faster than is possible by accessing the data’s primary storage location
- Caching allows you to efficiently reuse previously retrieved data
- Now instead of querying our MongoDB for every request, we will query the Redis first and only if we didn’t find what we are looking for, we will query MongoDB

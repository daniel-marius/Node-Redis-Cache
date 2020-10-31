const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");

const keys = require("../config/keys");

const client = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000
});

client.hget = util.promisify(client.hget);

// We need to add the logic that queries Redis, and if there is no answer it will query our MongoDB
// Because we want to reuse this logic for different queries, we will have to add a hook in Mongoose’s query generation and execution process

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = { time: 60 }) {
  this.useCache = true;
  this.time = options.time;
  this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);

  return this;
};

// Every query in mongoose uses a Query class to build the query and executes it via exec function
// We use the javascript prototype ability to add our reuse cache logic inside exec function

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return await exec.apply(this, arguments);
  }

  // To create the unique key in our cache, we use the query itself via getQuery() function that Query class exports (this function includes “where clause” )
  // Redis key has to be a string and getQuery() function returns an object, so we have to convert it to a string with JSON.stringify() function

  const key = JSON.stringify({
    ...this.getQuery()
  });

  const cacheValue = await client.hget(this.hashKey, key);

  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    console.log("Response from Redis");

    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // First, add a TTL for each key in Redis
  // Second, clear the relevant keys in Redis each time the DB gets updated
  // We need to store each query for a specific collection
  // For this, we can use Redis hashes

  const result = await.exec.apply(this, arguments);
  console.log(this.time);
  client.hset(this.hashKey, key, JSON.stringify(result));
  client.expire(this.hashKey, this.time);

  console.log("Response from MongoDB");
  return result;
};

// We need to pass an argument that represents our willingness to query Redis or query directly MongoDB
// This argument will be used as a flag

module.exports = {
  clearKey(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};

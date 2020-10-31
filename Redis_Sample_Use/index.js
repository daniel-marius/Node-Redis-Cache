const APP_PORT = process.env.APP_PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const BASE_URL = 'https://swapi.dev/api';

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const redis = require('redis');

// Configure redis client on port 6379
const redisClient = redis.createClient(REDIS_PORT);

// Configure express server
const app = express();

// Body parser middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Middleware function to check cache
const checkCache = (req, res, next) => {
  const { id } = req.params;

  redisClient.get(id, (err, data) => {
    if (err) {
      res.status(500).send(err);
    }

    if (data) {
      res.send(data);
    }

    next();
  });
};

//  Endpoint:  GET /starships/:id
//  @desc Return Starships data for particular starship id
app.get("/starships/:id", checkCache, async (req, res) => {
  try {
    const { id } = req.params;
    const starShipInfo = await axios.get(`${BASE_URL}/starships/${id}`);

    // Get data from response
    const { data } = starShipInfo;

    // Add data to Redis
    redisClient.setex(id, 3600, JSON.stringify(data));

    return res.json(data);
  } catch (error) {
    return res.status(500).json(error);
  }
});

app.listen(APP_PORT, () => {
  console.log(`Server running on port: ${APP_PORT}`)
});

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const keys = require("./config/keys");

require("./services/cache");
require("./models/Book");

const app = express();
app.use(bodyParser.json());

const MONGOOSE_OPTIONS = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
};

mongoose.connect(keys.mongoURI, MONGOOSE_OPTIONS);

require("./routes/bookRoutes")(app);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server listening on port`, PORT);
});

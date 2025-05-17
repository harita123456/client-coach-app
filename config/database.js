const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const mongodbConnect = mongoose
  .connect(process.env.MONGODB_URI, {})
  .connect(process.env.MONGODB_URI, {})
  .then(() => {
    console.log("Successfully connected to database...");
  });

mongoose.connection.on("error", (err) => {
  console.log(err);
});

module.exports = mongodbConnect;

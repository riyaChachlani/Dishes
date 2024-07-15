const mongoose = require("mongoose");
const Dish = require("./model");
const fs = require("fs");

//
mongoose.connect(
  "mongodb+srv://riyac0303:123%40123@cluster0.3qlolkc.mongodb.net/"
);

const connection = mongoose.connection;

connection.on("connected", () => {
  console.log("Mongo db connected successfully");
});

connection.on("error", (err) => {
  console.log("Mongo db connection error: ", err);
});

// Read the data from the file and stores it into the database
const importDishes = () => {
  fs.readFile("dishes.json", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      return;
    }

    const dishes = JSON.parse(data);

    Dish.insertMany(dishes)
      .then(() => {
        console.log("Dishes imported successfully");
        mongoose.connection.close();
      })
      .catch((err) => {
        console.error("Error inserting dishes:", err);
      });
  });
};

module.exports = mongoose;

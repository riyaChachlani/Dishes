const express = require("express");
const mongoose = require("mongoose");
const Dish = require("./model");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const morgan = require("morgan");

const app = express();
const port = 5008;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// MongoDB connection
mongoose
  .connect("mongodb+srv://riyac0303:123%40123@cluster0.3qlolkc.mongodb.net/")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.io setup
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3001", // Allow requests from this origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});
module.exports.io = io;

// Routes
app.get("/api/dishes", async (req, res) => {
  try {
    const dishes = await Dish.find({});
    res.json(dishes);
  } catch (err) {
    console.error("Error fetching dishes:", err);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/dishes/:id/toggle", async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).send("Dish not found");
    }
    dish.isPublished = !dish.isPublished;
    await dish.save();
    io.emit("dishUpdated", dish);
    res.json(dish);
  } catch (err) {
    console.error("Error toggling dish:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Watch the Dishes collection for changes using Change Streams
const db = mongoose.connection;
db.once("open", () => {
  console.log("MongoDB connection opened. Setting up Change Streams.");
  const changeStream = db.collection("dishes").watch();

  changeStream.on("change", (change) => {
    console.log("Change detected:", change);
    if (
      change.operationType === "update" ||
      change.operationType === "replace"
    ) {
      Dish.findById(change.documentKey._id)
        .then((updatedDish) => {
          io.emit("dishUpdated", updatedDish); // Emit the updated dish data to all clients
        })
        .catch((err) => {
          console.error("Error fetching updated dish:", err);
        });
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

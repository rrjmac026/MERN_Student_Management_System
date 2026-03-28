const express = require("express");
const app = express();
const dotenv = require("dotenv").config();


const PORT=process.env.PORT || 5000;

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Student Management System API" });
});

// Start server
app.listen(PORT, (err) => {
  console.log(`app is listening on port ${PORT}`);
});
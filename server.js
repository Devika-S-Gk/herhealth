const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// CONNECT MONGODB
mongoose.connect("mongodb://127.0.0.1:27017/herhealth")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

// USER SCHEMA
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);



// ================= REGISTER =================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const newUser = new User({
      name,
      email,
      password
    });

    await newUser.save();

    res.json({ message: "Registration successful" });

  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});


// ================= LOGIN =================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login email received:",email);

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "User not found" });
    }

    if (user.password !== password) {
      return res.json({ message: "Incorrect password" });
    }

   res.json({
  message: "Login successful",
  user: user
});

  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});


// START SERVER
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
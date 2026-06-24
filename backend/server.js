require("dotenv").config();

const express = require("express");
const path = require("path");
const http = require("http");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
  },
});

// =========================
// DATABASE
// =========================

connectDB();

// =========================
// MIDDLEWARE
// =========================

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// =========================
// SOCKET AUTH
// =========================

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;

    next();
  } catch (error) {
    next(new Error("Authentication Error"));
  }
});

// =========================
// SOCKET EVENTS
// =========================

io.on("connection", (socket) => {
  console.log(`${socket.user.username} connected`);

  // Join personal room
  socket.join(socket.user.userId);

  // Global chat
  socket.on("chat-message", async (message) => {
    try {
      const newMessage = await Message.create({
        sender: socket.user.userId,
        message,
      });

      io.emit("chat-message", {
        username: socket.user.username,
        message: newMessage.message,
        createdAt: newMessage.createdAt,
      });
    } catch (error) {
      console.error(error);
    }
  });

  // Private chat
socket.on("private-message", async (data) => {
  try {
    const { receiverId, message } = data;

    const saved = await Message.create({
      sender: socket.user.userId,

      receiver: receiverId,

      message,
    });

    const sender = await User.findById(socket.user.userId);

    const payload = {
      _id: saved._id,
      sender: sender._id,
      senderName: sender.username,
      receiver: receiverId,
      message: saved.message,
      createdAt: saved.createdAt,
    };

    io.to(receiverId).emit("private-message", payload);

    io.to(socket.user.userId).emit("private-message", payload);
  } catch (error) {
    console.error(error);
  }
});

  socket.on("disconnect", () => {
    console.log(`${socket.user.username} disconnected`);
  });
});

// =========================
// ROUTES
// =========================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// =========================
// REGISTER
// =========================

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// =========================
// LOGIN
// =========================

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      username,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// =========================
// GET USERS
// =========================

app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "username email");

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// =========================
// GLOBAL CHAT HISTORY
// =========================

app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({
        createdAt: 1,
      })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// =========================
// PRIVATE CHAT HISTORY
// =========================

app.get("/messages/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        {
          sender: userId,
          receiver: otherUserId,
        },
        {
          sender: otherUserId,
          receiver: userId,
        },
      ],
    }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const jwt = require("jsonwebtoken");

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

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
  });
});

const auth = require("./middleware/auth");

app.get("/chat", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/chat.html"));
});
const auth = require("./middleware/auth");

app.get("/chat", auth, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/chat.html"));
});
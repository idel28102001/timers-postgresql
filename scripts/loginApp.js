const bodyParser = require("body-parser");
const logs = require("./logs");
const express = require("express");
const cookieParser = require("cookie-parser");
const addTimerEvents = require("./userApp");
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.set("view engine", "njk");
addTimerEvents(app);

app.get("/", logs.auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    signError: req.query.signError === "true" ? "That username already exists" : req.query.signError,
    signSuccess: req.query.signSuccess === "true" ? "You signed-up succesfully" : req.query.signSuccess,
    timer: req.timer,
  });
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await logs.findUserByUserName(username, res);
  if (!user) {
    return res.redirect("/?authError=true");
  }
  if (!(await logs.bcrypt.compare(password, user.password))) {
    return res.redirect("/?authError=true");
  }
  const sessionId = await logs.createSession(user.id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.get("/logout", logs.auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await logs.deleteSession(req.sessionId, res);
  res.clearCookie("sessionId").redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  logs.updateUsers(username, password, res);
});

module.exports = app;

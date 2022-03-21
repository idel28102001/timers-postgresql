const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const knex = require("knex")({
  client: "pg",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
});

const findUserByUserName = async (username, res) => {
  try {
    return await knex("users")
      .select()
      .where({ username })
      .limit(1)
      .then((results) => results[0]);
  } catch (err) {
    console.error(err.message);
    return res.redirect("/?authError=true");
  }
};

const findUserBySessionId = async (sessionId) => {
  console.log(sessionId);
  const session = await knex("sessions")
    .select("user_id")
    .where({ session_id: sessionId })
    .limit(1)
    .then((results) => results[0]);
  if (session) {
    return knex("users")
      .select()
      .where({ id: session.user_id })
      .limit(1)
      .then((results) => results[0]);
  }
};

const createSession = async (userId) => {
  const sessionId = nanoid();
  await knex("sessions").insert({ user_id: userId, session_id: sessionId });
  return sessionId;
};

const deleteSession = async (sessionId, res) => {
  try {
    await knex("sessions").where({ session_id: sessionId }).delete();
  } catch (err) {
    console.error(err);
    return res.redirect("/");
  }
};

const createUser = async (username, password) => {
  const pass = await bcrypt.hash(password, 10);
  return { username, password: pass };
};

const updateUsers = async (username1, password1, res) => {
  const { username, password } = await createUser(username1, password1);
  try {
    await knex("users").insert({ username, password });
    res.redirect("/?signSuccess=true");
  } catch (err) {
    res.redirect("/?signError=true");
  }
};

const makeInts = (array) => {
  array.map((e) => {
    e.time_start = parseInt(e.time_start);
    e.progress = parseInt(e.progress);
    if (e.time_end) {
      e.time_end = parseInt(e.time_end);
      e.duration = parseInt(e.duration);
    }
  });
};

const getTimers = async (id) => {
  let isActive = await knex("timers").select().where({ user_id: id, is_active: true });
  let notActive = await knex("timers").select().where({ user_id: id, is_active: false });
  makeInts(isActive);
  makeInts(notActive);
  return { isActive, notActive };
};
const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }
  const user = await findUserBySessionId(req.cookies["sessionId"]);
  if (!user) {
    return next();
  }
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const getAll = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }
  const user = await findUserBySessionId(req.cookies["sessionId"]);
  if (user) {
    req.user_id = user.id;
    req.timer = await getTimers(user.id);
  }
  next();
};

module.exports = {
  findUserByUserName,
  findUserBySessionId,
  createSession,
  deleteSession,
  auth,
  updateUsers,
  getAll,
  bcrypt,
};

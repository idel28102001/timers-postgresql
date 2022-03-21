const timers = require("./timers");
const { getAll } = require("./logs");
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

const addTimerEvents = (app) => {
  app.get("/api/timers", getAll(), (req, res) => {
    if (req.query.isActive === "true") {
      const allElems = req.timer.isActive;
      timers.changeTic(allElems);
      res.send(allElems);
    } else {
      res.send(req.timer.notActive);
    }
  });

  app.post(`/api/timers/:id/stop`, getAll(), async (req, res) => {
    if (req.timer) {
      await knex.raw(
        `UPDATE timers SET is_active=false, time_end=${Date.now()}, duration=${Date.now()}-time_start WHERE id=${
          req.params.id
        }`
      );
    }
  });

  app.post("/api/timers", getAll(), async (req, res) => {
    if (req.timer) {
      const elem = timers.createTimer(req.body.description);
      elem.user_id = req.user_id;
      const [id] = await knex("timers").insert(elem).returning("id");
      res.send({ id });
    }
  });
};

module.exports = addTimerEvents;

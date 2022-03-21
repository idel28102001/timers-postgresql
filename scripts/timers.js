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

const stopTimer = (elem) => {
  elem.is_active = false;
  elem.time_end = Date.now();
  elem.duration = elem.time_end - elem.time_start;
};

const createTimer = (description) => {
  return { time_start: Date.now(), description, is_active: true, progress: 0 };
};

const changeTic = async (elems) => {
  if (elems.length) {
    await knex.raw(`UPDATE timers SET progress=${Date.now()}-time_start WHERE id IN (${elems.map((e) => e.id)})`);
    elems.map((e) => {
      e.progress = Date.now() - e.time_start;
    });
  }
};

module.exports = { stopTimer, createTimer, changeTic };

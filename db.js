/** Database setup for biztime. */

//let DB_URI  = 'postgresql:///biztime';
const { Client } = require("pg");

const DB_URI = (process.env.NODE_ENV === "test") ? "biztime_test" : "biztime";

const db = new Client({
  host: "/var/run/postgresql/",
  database: DB_URI,
});

db.connect();
module.exports = db;
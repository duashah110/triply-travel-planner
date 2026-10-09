
require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool();

async function checkTables() {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name",
      ["public"]
    );

    console.log("Database tables:");
    console.log(result.rows);
  } catch (error) {
    console.error("Database error:", error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
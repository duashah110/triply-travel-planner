const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Triply API is running" });
});

app.get("/api/trips", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trips ORDER BY start_date ASC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});
// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});
// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create a user
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    const result = await pool.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       RETURNING *`,
      [name, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});
// Create a user
app.post("/api/users", async (req, res) => {
  try {
    const { name, email } = req.body;

    const result = await pool.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       RETURNING *`,
      [name, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/trips", async (req, res) => {
  try {
    const {
      user_id,
      title,
      destination,
      start_date,
      end_date,
      description,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO trips
       (user_id, title, destination, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, title, destination, start_date, end_date, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create trip" });
  }
});

app.get("/api/trips/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM trips WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch trip" });
  }
});

app.put("/api/trips/:id", async (req, res) => {
  try {
    const {
      title,
      destination,
      start_date,
      end_date,
      description,
    } = req.body;

    const result = await pool.query(
      `UPDATE trips
       SET title = $1,
           destination = $2,
           start_date = $3,
           end_date = $4,
           description = $5
       WHERE id = $6
       RETURNING *`,
      [
        title,
        destination,
        start_date,
        end_date,
        description,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update trip" });
  }
});

app.delete("/api/trips/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM trips WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

const PORT = process.env.PORT || 5000;
// ==================== ACTIVITIES ====================

// Get all activities for a trip
app.get("/api/trips/:tripId/activities", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM activities
       WHERE trip_id = $1
       ORDER BY activity_date ASC, activity_time ASC`,
      [req.params.tripId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Create an activity
app.post("/api/trips/:tripId/activities", async (req, res) => {
  try {
    const {
      title,
      activity_date,
      activity_time,
      location,
      notes,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO activities
       (trip_id, title, activity_date, activity_time, location, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.params.tripId,
        title,
        activity_date,
        activity_time || null,
        location || null,
        notes || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create activity" });
  }
});

// Update an activity
app.put("/api/activities/:id", async (req, res) => {
  try {
    const {
      title,
      activity_date,
      activity_time,
      location,
      notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE activities
       SET title = $1,
           activity_date = $2,
           activity_time = $3,
           location = $4,
           notes = $5
       WHERE id = $6
       RETURNING *`,
      [
        title,
        activity_date,
        activity_time || null,
        location || null,
        notes || null,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

// Delete an activity
app.delete("/api/activities/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM activities WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete activity" });
  }
});
app.listen(PORT, () => {
  console.log(`Triply API running on http://localhost:${PORT}`);
}
);
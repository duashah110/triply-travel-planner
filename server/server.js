
const express = require("express");
const cors = require("cors");
const argon2 = require("argon2");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
require("dotenv").config();

const pool = require("./db");
const app = express();

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from environment variables");
}

app.use(session({
  store: new pgSession({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),
  name: "triply.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24,
  },
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please sign in" });
  }
  next();
};

// Check database connection / API status
app.get("/", (req, res) => {
  res.json({ message: "Triply API is running" });
});

// Get only the signed-in user's trips
app.get("/api/trips", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trips
       WHERE user_id = $1
       ORDER BY start_date ASC`,
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

// Create a trip for the signed-in user
app.post("/api/trips", requireAuth, async (req, res) => {
  try {
    const {
      title,
      destination,
      start_date,
      end_date,
      description,
    } = req.body;

    if (!title || !destination || !start_date || !end_date) {
      return res.status(400).json({
        error: "Title, destination, start date and end date are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO trips
       (user_id, title, destination, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.session.userId,
        title,
        destination,
        start_date,
        end_date,
        description || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Failed to create trip" });
  }
});

// Get one trip, only if it belongs to the signed-in user
app.get("/api/trips/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trips
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ error: "Failed to fetch trip" });
  }
});

// Update only the signed-in user's trip
app.put("/api/trips/:id", requireAuth, async (req, res) => {
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
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [
        title,
        destination,
        start_date,
        end_date,
        description || null,
        req.params.id,
        req.session.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ error: "Failed to update trip" });
  }
});

// Delete only the signed-in user's trip
app.delete("/api/trips/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM trips
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

// ==================== ACTIVITIES ====================

// Get activities only for a trip owned by the signed-in user
app.get(
  "/api/trips/:tripId/activities",
  requireAuth,
  async (req, res) => {
    try {
      const trip = await pool.query(
        "SELECT id FROM trips WHERE id = $1 AND user_id = $2",
        [req.params.tripId, req.session.userId]
      );

      if (trip.rows.length === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const result = await pool.query(
        `SELECT * FROM activities
         WHERE trip_id = $1
         ORDER BY activity_date ASC, activity_time ASC`,
        [req.params.tripId]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  }
);

// Create an activity only in the user's own trip
app.post(
  "/api/trips/:tripId/activities",
  requireAuth,
  async (req, res) => {
    try {
      const {
        title,
        activity_date,
        activity_time,
        location,
        notes,
      } = req.body;

      if (!title || !activity_date) {
        return res.status(400).json({
          error: "Activity title and date are required",
        });
      }

      const trip = await pool.query(
        "SELECT id FROM trips WHERE id = $1 AND user_id = $2",
        [req.params.tripId, req.session.userId]
      );

      if (trip.rows.length === 0) {
        return res.status(404).json({ error: "Trip not found" });
      }

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
      console.error("Error creating activity:", error);
      res.status(500).json({ error: "Failed to create activity" });
    }
  }
);

// Update an activity only if its trip belongs to the user
app.put("/api/activities/:id", requireAuth, async (req, res) => {
  try {
    const {
      title,
      activity_date,
      activity_time,
      location,
      notes,
    } = req.body;

    const result = await pool.query(
      `UPDATE activities AS a
       SET title = $1,
           activity_date = $2,
           activity_time = $3,
           location = $4,
           notes = $5
       FROM trips AS t
       WHERE a.id = $6
         AND a.trip_id = t.id
         AND t.user_id = $7
       RETURNING a.*`,
      [
        title,
        activity_date,
        activity_time || null,
        location || null,
        notes || null,
        req.params.id,
        req.session.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ error: "Failed to update activity" });
  }
});

// Delete an activity only if its trip belongs to the user
app.delete("/api/activities/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM activities AS a
       USING trips AS t
       WHERE a.id = $1
         AND a.trip_id = t.id
         AND t.user_id = $2
       RETURNING a.id`,
      [req.params.id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ error: "Failed to delete activity" });
  }
});

// ==================== AUTHENTICATION ====================

// Sign up
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 12
    ) {
      return res.status(400).json({
        error: "Name and email are required; password must be at least 12 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await argon2.hash(password);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed:", sessionError);
        return res.status(500).json({ error: "Could not create session" });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);
          return res.status(500).json({ error: "Could not save session" });
        }

        res.status(201).json({ user });
      });
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email is already registered" });
    }

    console.error("Signup failed:", error);
    res.status(500).json({ error: "Signup failed" });
  }
});

// Sign in
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.password_hash ||
      !(await argon2.verify(user.password_hash, password))
    ) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed:", sessionError);
        return res.status(500).json({ error: "Could not create session" });
      }

      req.session.userId = user.id;

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError);
          return res.status(500).json({ error: "Could not save session" });
        }

        res.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get the current signed-in user
app.get("/api/auth/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Please sign in" });
    }

    const result = await pool.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = $1`,
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return req.session.destroy(() => {
        res.clearCookie("triply.sid");
        res.status(401).json({ error: "Please sign in" });
      });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Session check failed:", error);
    res.status(500).json({ error: "Could not check session" });
  }
});

// Sign out
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error);
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("triply.sid", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    });

    res.json({ message: "Signed out successfully" });
  });
});

// Start locally; Vercel imports the app
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Triply API running on http://localhost:${PORT}`);
  });
}

pool.query("SELECT NOW()")
  .then(() => console.log("Neon database connected successfully"))
  .catch((error) => {
    console.error("Database connection failed:", error.message);
  });

module.exports = app;
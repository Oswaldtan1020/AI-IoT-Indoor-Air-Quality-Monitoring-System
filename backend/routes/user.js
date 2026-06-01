const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyUser = require("../middleware/verifyUser");
const generateAIRecommendations = require("../utils/iaqAI");

// USER can access this
router.get("/iaq-readings", verifyUser, async (req, res) => {
  console.log("Verified user:", req.user);

  try {
    const [rows] = await db.query(`
      SELECT 
        r.temperature,
        r.humidity,
        r.co2,
        r.pm25,
        r.timestamp,
        rm.name AS room
      FROM readings r
      JOIN rooms rm ON r.room_id = rm.id
      ORDER BY r.timestamp DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error("User IAQ error:", err);
    res.status(500).json({ error: "Failed to load IAQ data" });
  }
});

// USER: Get AI recommendation for a specific room
router.get("/ai-recommendation", verifyUser, async (req, res) => {

  const { room } = req.query;

  try {

    const [rows] = await db.query(`

      SELECT
        r.temperature,
        r.humidity,
        r.co2,
        r.pm25,
        r.timestamp,
        rm.name AS room_name

      FROM readings r

      JOIN rooms rm
      ON r.room_id = rm.id

      WHERE rm.name = ?

      ORDER BY r.timestamp DESC

      LIMIT 1

    `, [room]);

    if (!rows.length) {

      return res.status(404).json({
        error: "No sensor data available"
      });

    }

    const reading = rows[0];

    const status =
      reading.co2 <= 1000 && reading.pm25 <= 12
        ? "GOOD"
        : reading.co2 <= 2000 && reading.pm25 <= 35
        ? "WARNING"
        : "DANGEROUS";

    const ai = await generateAIRecommendations({

      room: reading.room_name,

      status,

      temperature: reading.temperature,

      humidity: reading.humidity,

      co2: reading.co2,

      pm25: reading.pm25

    });

    res.json({

      status: ai.status,
      actions: ai.actions,
      generated_at: new Date()

    });

  }
  catch (err) {

    console.error("User AI error:", err);

    res.status(500).json({
      error: "Failed to load AI recommendation"
    });

  }

});

module.exports = router;
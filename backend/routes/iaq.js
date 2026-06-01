const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verifyUser = require("../middleware/verifyUser");
const getIaqStatus = require("../utils/iaqStatus");

// USER & ADMIN – read-only IAQ data
router.get("/iaq-readings", verifyUser, async (req, res) => {
  console.log("IAQ access by:", req.user);

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

    const data = rows.map(r => ({
      ...r,
      status: getIaqStatus(r.co2, r.pm25)
    }));

    res.json(data);
  } catch (err) {
    console.error("IAQ route error:", err);
    res.status(500).json({ error: "Failed to load IAQ data" });
  }
});

/**
 * IAQ HISTORY (User & Admin)
 * Query params:
 *  - roomId (optional)
 *  - limit (default 50)
 */
router.get("/iaq-history", verifyUser, async (req, res) => {
  const { roomId, limit = 50 } = req.query;

  try {
    let sql = `
      SELECT 
        r.timestamp,
        r.temperature,
        r.humidity,
        r.co2,
        r.pm25,
        rm.name AS room
      FROM readings r
      JOIN rooms rm ON r.room_id = rm.id
    `;

    const params = [];

    if (roomId) {
      sql += " WHERE r.room_id = ?";
      params.push(roomId);
    }

    sql += `
      ORDER BY r.timestamp ASC
      LIMIT ?
    `;
    params.push(Number(limit));

    const [rows] = await db.query(sql, params);

    res.json({
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error("IAQ history error:", err);
    res.status(500).json({ error: "Failed to load IAQ history" });
  }
});

module.exports = router;

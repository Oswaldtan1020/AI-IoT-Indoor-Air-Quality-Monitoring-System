const db = require('../config/db');
const bcrypt = require('bcrypt');
const getIaqStatus = require("../utils/iaqStatus");
const generateAIRecommendations = require("../utils/iaqAI");

// Users
exports.getUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, username, role FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, username, password, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });

        const hashed = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)', [name, username, hashed, role || 'user']);
        res.json({ message: 'User created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, username, role } = req.body;
        await db.query('UPDATE users SET name = ?, username = ?, role = ? WHERE id = ?', [name, username, role, id]);
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id; // from JWT
    const requesterRole = req.user.role;

    // Fetch user to be deleted
    const [users] = await db.query(
      "SELECT id, role FROM users WHERE id = ?",
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const targetUser = users[0];

    // ❌ Prevent deleting admins
    if (targetUser.role === "admin") {
      return res.status(403).json({
        error: "Admin accounts cannot be deleted"
      });
    }

    // ❌ Prevent deleting yourself
    if (Number(id) === Number(requesterId)) {
      return res.status(403).json({
        error: "You cannot delete your own account"
      });
    }

    await db.query("DELETE FROM users WHERE id = ?", [id]);

    res.json({ message: "User deleted successfully" });

  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT last_login FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    res.json({
      lastLogin: rows.length ? rows[0].last_login : null
    });

  } catch (err) {
    console.error("Login history error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Sensors
exports.getSensors = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                s.id,
                s.sensor_code,
                s.board_id
            FROM sensors s
        `);

        res.json(rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.createSensor = async (req, res) => {
    const { sensor_code, room_id } = req.body;

    // 1️⃣ Basic validation
    if (!sensor_code) {
        return res.status(400).json({
            error: 'Sensor code is required'
        });
    }

    try {
        // 2️⃣ Check for duplicate sensor code
        const [existing] = await db.query(
            'SELECT id FROM sensors WHERE sensor_code = ?',
            [sensor_code]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                error: 'Sensor code already exists'
            });
        }

        // 3️⃣ Insert new sensor
        await db.query(
            'INSERT INTO sensors (sensor_code, room_id) VALUES (?, ?)',
            [sensor_code, room_id || null]
        );

        res.status(201).json({
            message: 'Sensor added successfully'
        });

    } catch (err) {
        console.error(err);

        // 4️⃣ Safety net for DB unique constraint
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'Sensor code already exists'
            });
        }

        res.status(500).json({
            error: 'Server error'
        });
    }
};

exports.deleteSensor = async (req, res) => {
    const { id } = req.params;

    try {
        // 1️⃣ Check if sensor exists and is assigned
        const [rows] = await db.query(
            'SELECT room_id FROM sensors WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Sensor not found'
            });
        }

        // 2️⃣ If assigned, block deletion
        if (rows[0].room_id !== null) {
            return res.status(400).json({
                error: 'Cannot delete sensor that is assigned to a room'
            });
        }

        // 3️⃣ Safe to delete
        await db.query(
            'DELETE FROM sensors WHERE id = ?',
            [id]
        );

        res.json({
            message: 'Sensor deleted successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Server error'
        });
    }
};

exports.assignSensor = async (req, res) => {
  try {
    const { id } = req.params;
    const board_id = Number(req.body.board_id);

    if (!board_id || isNaN(board_id)) {
      return res.status(400).json({
        error: "Valid board is required"
      });
    }

    // check board exists
    const [boards] = await db.query(
      "SELECT id FROM boards WHERE id = ?",
      [board_id]
    );

    if (boards.length === 0) {
      return res.status(400).json({
        error: "Board does not exist"
      });
    }

    // 🔥 LIMIT: max 2 sensors per board
    const [count] = await db.query(
      "SELECT COUNT(*) as total FROM sensors WHERE board_id = ?",
      [board_id]
    );

    if (count[0].total >= 2) {
      return res.status(400).json({
        error: "Board already has 2 sensors"
      });
    }

    await db.query(
      "UPDATE sensors SET board_id = ? WHERE id = ?",
      [board_id, id]
    );

    res.json({ message: "Sensor assigned to board" });

  } catch (err) {
    console.error("Assign sensor error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.unassignSensor = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      "UPDATE sensors SET board_id = NULL WHERE id = ?",
      [id]
    );

    res.json({ message: "Sensor unassigned successfully" });

  } catch (err) {
    console.error("Unassign error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Readings
exports.getAllReadings = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        rooms.name AS room,
        readings.temperature,
        readings.humidity,
        readings.co2,
        readings.pm25,
        readings.timestamp
      FROM readings
      JOIN rooms ON readings.room_id = rooms.id
      ORDER BY readings.timestamp DESC
      LIMIT 50
    `);

    const results = [];

    for (const row of rows) {
      const status = getIaqStatus(row.co2, row.pm25);

      let aiSuggestions = [];

      try {
        const aiResult = await generateAIRecommendations({
          room: row.room,
          status,
          temperature: row.temperature,
          humidity: row.humidity,
          co2: row.co2,
          pm25: row.pm25
        });

        aiSuggestions = aiResult.actions || [];

      } catch (aiErr) {
        console.error("Groq AI error for room:", row.room, aiErr.message);
        aiSuggestions = ["AI recommendation temporarily unavailable"];
      }

      results.push({
        ...row,
        status,
        aiSuggestions
      });
    }

    res.json(results);

  } catch (err) {
    console.error("getAllReadings error:", err);
    res.status(500).json({ error: "Failed to load IAQ readings" });
  }
};

//Rooms
exports.getRooms = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.id,
        r.name,
        b.board_code,
        COUNT(s.id) AS sensor_count
      FROM rooms r
      LEFT JOIN boards b ON r.id = b.room_id
      LEFT JOIN sensors s ON b.id = s.board_id
      GROUP BY r.id
      ORDER BY 
        CASE 
          WHEN b.board_code IS NULL THEN 999
          ELSE CAST(SUBSTRING(b.board_code, 7) AS UNSIGNED)
        END ASC;
    `);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { name } = req.body;

    // 1️⃣ Insert room
    const [result] = await db.query(
      "INSERT INTO rooms (name) VALUES (?)",
      [name]
    );

    const room_id = result.insertId;

    // 2️⃣ Auto create board
    const board_code = `ESP8266-${String(room_id).padStart(2, "0")}`;

    await db.query(
      "INSERT INTO boards (board_code, room_id) VALUES (?, ?)",
      [board_code, room_id]
    );

    res.json({ message: "Room + Board created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteRoom = async (req, res) => {
  const { id } = req.params;

  const [sensors] = await db.query(
    "SELECT id FROM sensors WHERE room_id = ?",
    [id]
  );

  if (sensors.length > 0) {
    return res.status(400).json({
      error: "Room has assigned sensors"
    });
  }

  await db.query("DELETE FROM rooms WHERE id = ?", [id]);

  res.json({ message: "Room deleted" });
};

exports.generateRoomAI = async (req, res) => {
  try {
    const roomId = req.params.id;

    // 1️⃣ Get room + latest reading
    const [rows] = await db.query(`
      SELECT
        rm.name AS room,
        r.temperature,
        r.humidity,
        r.co2,
        r.pm25
      FROM rooms rm
      JOIN readings r ON r.room_id = rm.id
      WHERE rm.id = ?
      ORDER BY r.timestamp DESC
      LIMIT 1
    `, [roomId]);

    if (!rows.length) {
      return res.status(404).json({
        error: "No sensor data for this room"
      });
    }

    const { room, temperature, humidity, co2, pm25 } = rows[0];

    // 2️⃣ Determine status
    const status =
      co2 <= 1000 && pm25 <= 12 ? "GOOD" :
      co2 <= 2000 && pm25 <= 35 ? "WARNING" :
      "DANGEROUS";

    // 3️⃣ Generate AI (ADMIN ONLY)
    const aiResult = await generateAIRecommendations({
      room,
      status,
      temperature,
      humidity,
      co2,
      pm25
    });

    // 4️⃣ Save to DB (overwrite old)
    await db.query(`
      INSERT INTO ai_recommendations (room_id, status, actions)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        actions = VALUES(actions),
        created_at = CURRENT_TIMESTAMP
    `, [
      roomId,
      aiResult.status,
      JSON.stringify(aiResult.actions)
    ]);

    res.json({
      message: "AI recommendation generated successfully"
    });

  } catch (err) {
    console.error("Generate AI error:", err);
    res.status(500).json({
      error: "Failed to generate AI recommendation"
    });
  }
};

exports.getSensorsByRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      "SELECT id, sensor_code FROM sensors WHERE room_id = ?",
      [id]
    );

    res.json(rows);

  } catch (err) {
    console.error("Get sensors by room error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Boards
exports.getBoards = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        b.id,
        b.board_code,
        r.name AS room_name
      FROM boards b
      JOIN rooms r ON b.room_id = r.id
    `);

    res.json(rows);

  } catch (err) {
    console.error("Get boards error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
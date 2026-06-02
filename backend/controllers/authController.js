// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ---------- ADMIN LOGIN (for admin panel) ----------
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ✅ Input validation first
    if (!username && !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Password is required'
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];

    // ✅ only allow admins here
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: not an admin' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const [[updated]] = await db.query(
      'SELECT last_login FROM users WHERE id = ?',
      [user.id]
    );

    res.json({
      id: user.id,
      adminName: user.name,
      adminRole: user.role,
      lastLogin: updated.last_login,
      token
    });

  } catch (err) {
    console.error("========== LOGIN ERROR ==========");
    console.error(err);
    console.error(err.stack);
    console.error("================================");

    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

// ---------- NORMAL USER LOGIN (optional separate portal) ----------
exports.userLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username && !password) {
      return res.status(400).json({
        message: 'Username and password are required'
      });
    }

    if (!username) {
      return res.status(400).json({
        message: 'Username is required'
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Password is required'
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = rows[0];

    // ✅ this endpoint is only for normal users
    if (user.role !== 'user') {
      return res.status(403).json({ message: 'This login is for normal users only' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    await db.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    res.json({
      message: 'User login success',
      token,
      name: user.name,
      role: user.role
    });

  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

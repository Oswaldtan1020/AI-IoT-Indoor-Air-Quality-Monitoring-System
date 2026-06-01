// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ Admin login route (for admin_login.html)
router.post('/login', authController.adminLogin);

// ✅ Optional separate user login route (for normal user portal)
router.post('/user-login', authController.userLogin);

module.exports = router;

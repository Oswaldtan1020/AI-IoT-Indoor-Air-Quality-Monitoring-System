const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticateToken = require('../middleware/authMiddleware');
const getIaqStatus = require("../utils/iaqStatus");
const generateAIRecommendations = require("../utils/iaqAI");


// Protect all admin routes
router.use(authenticateToken);

// Users CRUD
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get("/login-history/:id", adminController.getLoginHistory);

// Sensors CRUD
router.get('/sensors', adminController.getSensors);
router.post('/sensors', adminController.createSensor);
router.put('/sensors/:id', adminController.assignSensor);
router.delete('/sensors/:id', adminController.deleteSensor);
router.put('/sensors/unassign/:id', adminController.unassignSensor);

// Readings
router.get('/all-readings', adminController.getAllReadings);

// Rooms
router.get("/rooms", adminController.getRooms);
router.post("/rooms", adminController.createRoom);
router.delete("/rooms/:id", adminController.deleteRoom);
router.post(
  "/rooms/:id/generate-ai",
  authenticateToken,
  adminController.generateRoomAI
);
router.get('/rooms/:id/sensors', adminController.getSensorsByRoom);

// Boards
router.get('/boards', adminController.getBoards);


module.exports = router;
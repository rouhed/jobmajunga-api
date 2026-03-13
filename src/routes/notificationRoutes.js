const express = require('express');
const router = express.Router();
const nc = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, nc.getMyNotifications);
router.put('/:id/read', authenticateToken, nc.markAsRead);

module.exports = router;

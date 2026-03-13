const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

router.get('/me', authenticateToken, profileController.getMe);
router.put('/me', authenticateToken, profileController.updateMe);

module.exports = router;

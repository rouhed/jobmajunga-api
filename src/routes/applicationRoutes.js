const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, applicationController.apply);
router.get('/me', authenticateToken, applicationController.getMyApplications);

module.exports = router;

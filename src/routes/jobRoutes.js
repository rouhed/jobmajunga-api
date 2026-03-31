const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { optionalProtect } = require('../middleware/auth');

router.get('/', optionalProtect, jobController.getJobs);
router.get('/:id', optionalProtect, jobController.getJobById);

module.exports = router;

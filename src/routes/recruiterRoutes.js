const express = require('express');
const router = express.Router();
const rc = require('../controllers/recruiterController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication + recruiter/admin role
router.use(authenticateToken);
router.use(authorizeRole('recruiter', 'admin'));

// Dashboard
router.get('/dashboard', rc.getDashboardStats);

// Job CRUD
router.get('/jobs', rc.getMyJobs);
router.post('/jobs', rc.createJob);
router.put('/jobs/:id', rc.updateJob);
router.delete('/jobs/:id', rc.deleteJob);

// Applications
router.get('/applications', rc.getReceivedApplications);
router.put('/applications/:id/status', rc.updateApplicationStatus);

module.exports = router;

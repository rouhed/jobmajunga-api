const express = require('express');
const router = express.Router();
const rc = require('../controllers/recruiterController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication + recruiter/admin role
router.use(authenticateToken);
router.use(authorizeRole('recruiter', 'admin'));

// Dashboard
router.get('/dashboard', rc.getDashboardStats);

// Profile
router.get('/profile', rc.getProfile);
router.put('/profile', rc.updateProfile);
router.post('/upload-photo', rc.uploadPhoto);

// Job CRUD
router.get('/jobs', rc.getMyJobs);
router.post('/jobs', rc.createJob);
router.put('/jobs/:id', rc.updateJob);
router.delete('/jobs/:id', rc.deleteJob);

// Applications
router.get('/applications', rc.getReceivedApplications);
router.put('/applications/:id/status', rc.updateApplicationStatus);

// Password
router.put('/password', rc.updatePassword);

module.exports = router;

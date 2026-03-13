const express = require('express');
const router = express.Router();
const cvController = require('../controllers/cvController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, cvController.getMyCVs);
router.post('/', authenticateToken, cvController.createCV);
router.get('/:id', authenticateToken, cvController.getCVDetail);
router.put('/:id', authenticateToken, cvController.updateCV);
router.delete('/:id', authenticateToken, cvController.deleteCV);
router.post('/:id/duplicate', authenticateToken, cvController.duplicateCV);
router.get('/:id/export/pdf', authenticateToken, cvController.exportPDF);

module.exports = router;

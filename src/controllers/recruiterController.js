const Job = require('../models/jobModel');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const Profile = require('../models/profileModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config for Photo
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/photos';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage }).single('photo');

// Recruiter: Create job
exports.createJob = async (req, res) => {
    try {
        const { title, description, contractType, location, salaryMin, salaryMax, requirements, skills } = req.body;
        const [result] = await pool.execute(
            `INSERT INTO job_offers (recruiter_id, title, description, contract_type, location, salary_min, salary_max, requirements, required_skills, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
            [req.user.id, title, description, contractType, location, salaryMin, salaryMax, requirements, skills]
        );
        res.status(201).json({ id: result.insertId, message: 'Offre créée avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création', details: error.message });
    }
};

// Recruiter: Get my jobs
exports.getMyJobs = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT * FROM job_offers WHERE recruiter_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des offres' });
    }
};

// Recruiter: Update job
exports.updateJob = async (req, res) => {
    try {
        const { title, description, contractType, location, salaryMin, salaryMax, status } = req.body;
        await pool.execute(
            `UPDATE job_offers SET title=?, description=?, contract_type=?, location=?, salary_min=?, salary_max=?, status=?, updated_at=NOW()
       WHERE id=? AND recruiter_id=?`,
            [title, description, contractType, location, salaryMin, salaryMax, status, req.params.id, req.user.id]
        );
        res.json({ message: 'Offre mise à jour' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};

// Recruiter: Delete job
exports.deleteJob = async (req, res) => {
    try {
        await pool.execute('DELETE FROM job_offers WHERE id=? AND recruiter_id=?', [req.params.id, req.user.id]);
        res.json({ message: 'Offre supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};

// Recruiter: Get applications for my jobs
exports.getReceivedApplications = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT a.*, jo.title as job_title, cp.first_name, cp.last_name, cp.phone, u.email 
       FROM applications a
       JOIN job_offers jo ON a.job_offer_id = jo.id
       JOIN candidate_profiles cp ON a.candidate_id = cp.user_id
       JOIN users u ON a.candidate_id = u.id
       WHERE jo.recruiter_id = ?
       ORDER BY a.created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des candidatures' });
    }
};

// Recruiter: Update application status
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await pool.execute('UPDATE applications SET status=?, updated_at=NOW() WHERE id=?', [status, req.params.id]);
        res.json({ message: 'Statut mis à jour' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const [[jobCount]] = await pool.execute('SELECT COUNT(*) as count FROM job_offers WHERE recruiter_id = ?', [req.user.id]);
        const [[appCount]] = await pool.execute(
            `SELECT COUNT(*) as count FROM applications a JOIN job_offers jo ON a.job_offer_id = jo.id WHERE jo.recruiter_id = ?`,
            [req.user.id]
        );
        const [[pendingCount]] = await pool.execute(
            `SELECT COUNT(*) as count FROM applications a JOIN job_offers jo ON a.job_offer_id = jo.id WHERE jo.recruiter_id = ? AND a.status = 'pending'`,
            [req.user.id]
        );
        const [[interviewCount]] = await pool.execute(
            `SELECT COUNT(*) as count FROM applications a JOIN job_offers jo ON a.job_offer_id = jo.id WHERE jo.recruiter_id = ? AND a.status = 'interview'`,
            [req.user.id]
        );
        res.json({
            totalJobs: jobCount.count,
            totalApplications: appCount.count,
            pendingApplications: pendingCount.count,
            scheduledInterviews: interviewCount.count,
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur Dashboard' });
    }
};

// Update password
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
        res.json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour du mot de passe' });
    }
};

// Profile management
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT rp.*, u.email 
             FROM recruiter_profiles rp
             JOIN users u ON rp.user_id = u.id
             WHERE rp.user_id = ?`,
            [req.user.id]
        );
        
        if (rows.length === 0) {
            // If profile doesn't exist yet, return user email and placeholder
            const [userRows] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
            return res.json({ 
                name: "Nom à définir", 
                email: userRows[0]?.email || "Email non trouvé",
                photo_url: null 
            });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erreur profile', details: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const profile = await Profile.update(req.user.id, 'recruiter', req.body);
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Erreur mise à jour profile', details: error.message });
    }
};

exports.uploadPhoto = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(500).json({ error: 'Erreur upload', details: err.message });
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

        const photoUrl = `/uploads/photos/${req.file.filename}`;
        try {
            await pool.execute('UPDATE recruiter_profiles SET photo_url = ? WHERE user_id = ?', [photoUrl, req.user.id]);
            res.json({ photo_url: photoUrl });
        } catch (error) {
            res.status(500).json({ error: 'Erreur BDD photo', details: error.message });
        }
    });
};

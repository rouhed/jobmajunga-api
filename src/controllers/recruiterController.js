const Job = require('../models/jobModel');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const Profile = require('../models/profileModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Config for Photo — memory storage (no disk writes for Render compatibility)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } }).single('photo');

// Recruiter: Create job
exports.createJob = async (req, res) => {
    try {
        console.log('[createJob] Body:', JSON.stringify(req.body));
        const companyId = req.user.parent_id || req.user.id;
        const { title, description, contractType, location, salaryMin, salaryMax, requirements, skills, status } = req.body;
        const finalStatus = status && ['draft', 'published', 'expired', 'archived'].includes(status) ? status : 'published';
        
        const [result] = await pool.execute(
            `INSERT INTO job_offers (recruiter_id, created_by_user_id, title, description, contract_type, location, salary_min, salary_max, requirements, required_skills, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                companyId, 
                req.user.id,
                title, 
                description, 
                contractType, 
                location, 
                salaryMin ?? null, 
                salaryMax ?? null, 
                requirements ?? null, 
                skills ?? null, 
                finalStatus
            ]
        );
        res.status(201).json({ id: result.insertId, message: 'Offre créée avec succès' });
    } catch (error) {
        console.error('[createJob] Error:', error);
        res.status(500).json({ error: 'Erreur lors de la création', details: error.message });
    }
};

// Recruiter: Get my jobs
exports.getMyJobs = async (req, res) => {
    try {
        const companyId = req.user.parent_id || req.user.id;
        const [rows] = await pool.execute(
            `SELECT jo.*, u.email as publisher_email, u.role as publisher_role, rp.photo_url as company_logo
             FROM job_offers jo 
             LEFT JOIN users u ON jo.created_by_user_id = u.id 
             LEFT JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id
             WHERE jo.recruiter_id = ? 
             ORDER BY jo.created_at DESC`,
            [companyId]
        );
        res.json(rows);
    } catch (error) {
        console.error('[getMyJobs] Error:', error);
        res.status(500).json({ error: 'Erreur lors du chargement des offres' });
    }
};

// Recruiter: Update job
exports.updateJob = async (req, res) => {
    try {
        const companyId = req.user.parent_id || req.user.id;
        const { title, description, contractType, location, salaryMin, salaryMax, status } = req.body;
        await pool.execute(
            `UPDATE job_offers SET title=?, description=?, contract_type=?, location=?, salary_min=?, salary_max=?, status=?, updated_at=NOW()
       WHERE id=? AND recruiter_id=?`,
            [title, description, contractType, location, salaryMin, salaryMax, status, req.params.id, companyId]
        );
        res.json({ message: 'Offre mise à jour' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};

// Recruiter: Delete job
exports.deleteJob = async (req, res) => {
    try {
        const companyId = req.user.parent_id || req.user.id;
        await pool.execute('DELETE FROM job_offers WHERE id=? AND recruiter_id=?', [req.params.id, companyId]);
        res.json({ message: 'Offre supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};

// Recruiter: Get applications for my jobs
exports.getReceivedApplications = async (req, res) => {
    try {
        const companyId = req.user.parent_id || req.user.id;
        const [rows] = await pool.execute(
            `SELECT a.*, jo.title as job_title, cp.first_name, cp.last_name, cp.phone, u.email 
       FROM applications a
       JOIN job_offers jo ON a.job_offer_id = jo.id
       JOIN candidate_profiles cp ON a.candidate_id = cp.user_id
       JOIN users u ON a.candidate_id = u.id
       WHERE jo.recruiter_id = ?
       ORDER BY a.created_at DESC`,
            [companyId]
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
        const companyId = req.user.parent_id || req.user.id;
        const [[jobCount]] = await pool.execute('SELECT COUNT(*) as count FROM job_offers WHERE recruiter_id = ?', [companyId]);
        const [[appCount]] = await pool.execute(
            `SELECT COUNT(*) as count FROM applications a JOIN job_offers jo ON a.job_offer_id = jo.id WHERE jo.recruiter_id = ?`,
            [companyId]
        );
        const [[pendingCount]] = await pool.execute(
            `SELECT COUNT(*) as count FROM applications a JOIN job_offers jo ON a.job_offer_id = jo.id WHERE jo.recruiter_id = ? AND a.status = 'pending'`,
            [companyId]
        );
        const [[interviewCount]] = await pool.execute(
            `SELECT COUNT(*) as count FROM applications a JOIN job_offers jo ON a.job_offer_id = jo.id WHERE jo.recruiter_id = ? AND a.status = 'interview'`,
            [companyId]
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
        const companyId = req.user.parent_id || req.user.id;
        console.log(`[getProfile] userId=${req.user.id}, companyId=${companyId}`);
        const [rows] = await pool.execute(
            `SELECT rp.*, u.email 
             FROM recruiter_profiles rp
             JOIN users u ON rp.user_id = u.id
             WHERE rp.user_id = ?`,
            [companyId]
        );
        
        if (rows.length === 0) {
            // If profile doesn't exist yet, return user email and placeholder
            const [userRows] = await pool.execute('SELECT email FROM users WHERE id = ?', [companyId]);
            return res.json({ 
                name: "Nom à définir", 
                email: userRows[0]?.email || "Email non trouvé",
                photo_url: null 
            });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(`[getProfile] ERROR:`, error);
        res.status(500).json({ error: 'Erreur profile', details: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (req.user.parent_id) {
            return res.status(403).json({ error: 'Seulement l\'administrateur principal peut modifier le profil.' });
        }
        console.log(`[updateProfile] userId=${req.user.id}, body=`, JSON.stringify(req.body));
        const profile = await Profile.update(req.user.id, 'recruiter', req.body);
        res.json(profile);
    } catch (error) {
        console.error(`[updateProfile] ERROR:`, error);
        res.status(500).json({ error: 'Erreur mise à jour profile', details: error.message });
    }
};

exports.uploadPhoto = (req, res) => {
    if (req.user.parent_id) {
        return res.status(403).json({ error: 'Seulement l\'administrateur principal peut modifier la photo.' });
    }
    upload(req, res, async (err) => {
        if (err) return res.status(500).json({ error: 'Erreur upload', details: err.message });
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });

        // Convert image buffer to base64 data URI for persistent storage in DB
        const mimeType = req.file.mimetype || 'image/png';
        const base64 = req.file.buffer.toString('base64');
        const dataUri = `data:${mimeType};base64,${base64}`;

        try {
            await pool.execute('UPDATE recruiter_profiles SET photo_url = ? WHERE user_id = ?', [dataUri, req.user.id]);
            res.json({ photo_url: dataUri });
        } catch (error) {
            res.status(500).json({ error: 'Erreur BDD photo', details: error.message });
        }
    });
};

// Sub-users Management
exports.getSubUsers = async (req, res) => {
    try {
        if (req.user.parent_id) return res.status(403).json({ error: 'Accès refusé' });
        
        const [rows] = await pool.execute(
            'SELECT id, email, created_at FROM users WHERE parent_id = ? AND role = "recruiter" ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des utilisateurs' });
    }
};

exports.createSubUser = async (req, res) => {
    try {
        if (req.user.parent_id) return res.status(403).json({ error: 'Accès refusé' });
        
        const { email, password } = req.body;
        
        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, role, parent_id) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, 'recruiter', req.user.id]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Utilisateur créé avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la création de l\'utilisateur' });
    }
};

exports.deleteSubUser = async (req, res) => {
    try {
        if (req.user.parent_id) return res.status(403).json({ error: 'Accès refusé' });
        
        await pool.execute('DELETE FROM users WHERE id = ? AND parent_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
};

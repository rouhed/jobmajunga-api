const Job = require('../models/jobModel');
const pool = require('../config/db');

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

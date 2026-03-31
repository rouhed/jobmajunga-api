const Application = require('../models/applicationModel');
const NotificationService = require('../services/notificationService');
const pool = require('../config/db');

exports.apply = async (req, res) => {
    try {
        const { jobOfferId, cvId } = req.body;
        const result = await Application.create(req.user.id, jobOfferId, cvId);

        // Notify recruiter
        const [[jobInfo]] = await pool.execute(
            `SELECT jo.title, jo.recruiter_id, cp.first_name, cp.last_name 
             FROM job_offers jo 
             JOIN candidate_profiles cp ON cp.user_id = ? 
             WHERE jo.id = ?`,
            [req.user.id, jobOfferId]
        );

        if (jobInfo) {
            await NotificationService.notifyNewApplication(
                jobInfo.recruiter_id,
                jobInfo.title,
                `${jobInfo.first_name} ${jobInfo.last_name}`
            );
        }

        res.status(201).json({ message: 'Candidature envoyée avec succès', ...result });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre' });
        }
        res.status(500).json({ error: 'Erreur lors de la candidature' });
    }
};

exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.getByCandidate(req.user.id);
        res.json(applications);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des candidatures' });
    }
};

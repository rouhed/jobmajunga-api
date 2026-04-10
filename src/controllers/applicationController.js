const Application = require('../models/applicationModel');
const NotificationService = require('../services/notificationService');
const pool = require('../config/db');

exports.apply = async (req, res) => {
    try {
        const { jobOfferId, cvId } = req.body;

        // Check if there's already an application
        const [existing] = await pool.execute(
            'SELECT id, status FROM applications WHERE candidate_id = ? AND job_offer_id = ?',
            [req.user.id, jobOfferId]
        );

        if (existing.length > 0) {
            if (['rejected', 'interview_declined', 'offer_declined'].includes(existing[0].status)) {
                // Remove the rejected application so the candidate can apply again
                await pool.execute('DELETE FROM applications WHERE id = ?', [existing[0].id]);
            } else {
                return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre' });
            }
        }

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

// Candidate updates their own application status (accept/decline interview or offer)
exports.updateStatus = async (req, res) => {
    try {
        const appId = req.params.id;
        const { status } = req.body;

        // Only candidate-side statuses are allowed here
        const allowedStatuses = ['interview_accepted', 'interview_declined', 'offer_accepted', 'offer_declined'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Statut non autorisé pour un candidat' });
        }

        // Verify this application belongs to this candidate
        const [[app]] = await pool.execute(
            'SELECT id, job_offer_id FROM applications WHERE id = ? AND candidate_id = ?',
            [appId, req.user.id]
        );

        if (!app) {
            return res.status(404).json({ error: 'Candidature introuvable ou accès refusé' });
        }

        await pool.execute(
            'UPDATE applications SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, appId]
        );

        // Notify recruiter of candidate decision
        const [[jobInfo]] = await pool.execute(
            `SELECT jo.title, jo.recruiter_id, cp.first_name, cp.last_name 
             FROM job_offers jo 
             JOIN candidate_profiles cp ON cp.user_id = ?
             WHERE jo.id = ?`,
            [req.user.id, app.job_offer_id]
        );

        if (jobInfo) {
            const NotificationService = require('../services/notificationService');
            const statusMessages = {
                interview_accepted: `✅ ${jobInfo.first_name} ${jobInfo.last_name} a accepté l'entretien pour "${jobInfo.title}"`,
                interview_declined: `❌ ${jobInfo.first_name} ${jobInfo.last_name} a refusé l'entretien pour "${jobInfo.title}"`,
                offer_accepted: `🎉 ${jobInfo.first_name} ${jobInfo.last_name} a accepté l'offre d'embauche pour "${jobInfo.title}"!`,
                offer_declined: `😞 ${jobInfo.first_name} ${jobInfo.last_name} a refusé l'offre d'embauche pour "${jobInfo.title}"`
            };
            await NotificationService.createNotification(
                jobInfo.recruiter_id,
                statusMessages[status] || `Décision candidat: ${status}`,
                'application_update',
                appId
            );
        }

        // If candidate declined the offer, un-archive the job offer so it reappears and they can try again
        if (status === 'offer_declined') {
            await pool.execute(
                "UPDATE job_offers SET status='published', updated_at=NOW() WHERE id=?",
                [app.job_offer_id]
            );
        }

        res.json({ message: 'Statut mis à jour avec succès', status });
    } catch (error) {
        console.error('[updateStatus] Error:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du statut' });
    }
};

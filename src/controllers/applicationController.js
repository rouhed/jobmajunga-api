const Application = require('../models/applicationModel');

exports.apply = async (req, res) => {
    try {
        const { jobOfferId, cvId } = req.body;
        const result = await Application.create(req.user.id, jobOfferId, cvId);
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

const CV = require('../models/cvModel');

exports.getMyCVs = async (req, res) => {
    try {
        const cvs = await CV.getAllByUserId(req.user.id);
        res.json(cvs);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching CVs' });
    }
};

exports.createCV = async (req, res) => {
    try {
        const cv = await CV.create(req.user.id, req.body);
        res.status(201).json(cv);
    } catch (error) {
        res.status(500).json({ error: 'Server error creating CV' });
    }
};

exports.getCVDetail = async (req, res) => {
    try {
        const cv = await CV.getById(req.params.id, req.user.id);
        if (!cv) return res.status(404).json({ error: 'CV not found' });

        const sections = await CV.getSections(req.params.id);
        res.json({ ...cv, sections });
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching CV details' });
    }
};

exports.updateCV = async (req, res) => {
    try {
        const { title, template_name, is_default, sections, cv_type, file_url } = req.body;
        await CV.update(req.params.id, req.user.id, { 
            title, 
            templateName: template_name, 
            isDefault: is_default,
            cvType: cv_type,
            fileUrl: file_url 
        });

        if (sections) {
            await CV.updateSections(req.params.id, sections);
        }

        res.json({ message: 'CV updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error updating CV' });
    }
};

exports.deleteCV = async (req, res) => {
    try {
        await CV.delete(req.params.id, req.user.id);
        res.json({ message: 'CV deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error deleting CV' });
    }
};

exports.duplicateCV = async (req, res) => {
    try {
        const newCv = await CV.duplicate(req.params.id, req.user.id);
        res.status(201).json(newCv);
    } catch (error) {
        res.status(500).json({ error: 'Server error duplicating CV' });
    }
};

const PDFService = require('../services/pdfService');
const Profile = require('../models/profileModel');

exports.exportPDF = async (req, res) => {
    try {
        const cvId = req.params.id;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;

        let cv;
        let candidateId;

        if (currentUserRole === 'recruiter') {
            // Check if recruiter has an application from this candidate with this CV
            const companyId = req.user.parent_id || req.user.id;
            const [application] = await pool.execute(
                `SELECT a.candidate_id 
                 FROM applications a 
                 JOIN job_offers jo ON a.job_offer_id = jo.id 
                 WHERE a.cv_id = ? AND jo.recruiter_id = ?`,
                [cvId, companyId]
            );

            if (application.length === 0) {
                return res.status(403).json({ error: 'Accès refusé : aucune candidature liée' });
            }
            
            // Get CV without candidates' session restriction
            const [cvRows] = await pool.execute('SELECT * FROM cvs WHERE id = ?', [cvId]);
            cv = cvRows[0];
            candidateId = application[0].candidate_id;
        } else {
            // Standard candidate access
            cv = await CV.getById(cvId, currentUserId);
            candidateId = currentUserId;
        }

        if (!cv) return res.status(404).json({ error: 'CV non trouvé' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=cv_${req.params.id}.pdf`);

        if (cv.cv_type === 'pdf' && cv.file_url) {
            // file_url format is "data:application/pdf;base64,...base64Data..."
            const base64Data = cv.file_url.split(',')[1];
            const pdfBuffer = Buffer.from(base64Data, 'base64');
            return res.send(pdfBuffer);
        }

        const sections = await CV.getSections(cvId);
        const profile = await Profile.getByUserId(candidateId);

        await PDFService.generateCV({ ...cv, sections }, profile, res);
    } catch (error) {
        console.error('PDF Export Error:', error);
        res.status(500).json({ error: 'Server error exporting PDF' });
    }
};

const pool = require('../config/db');

class Application {
    static async create(candidateId, jobOfferId, cvId) {
        const [result] = await pool.execute(
            'INSERT INTO applications (candidate_id, job_offer_id, cv_id) VALUES (?, ?, ?)',
            [candidateId, jobOfferId, cvId]
        );
        return { id: result.insertId };
    }

    static async getByCandidate(candidateId) {
        const [rows] = await pool.execute(
            `SELECT a.id, a.job_offer_id, a.cv_id, a.cover_letter, a.status, 
                    a.recruiter_notes, a.interview_date, a.applied_at, a.updated_at,
                    jo.title as job_title, jo.contract_type, jo.location as job_location,
                    rp.name as company_name
             FROM applications a 
             JOIN job_offers jo ON a.job_offer_id = jo.id 
             LEFT JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id 
             WHERE a.candidate_id = ? 
             ORDER BY a.applied_at DESC`,
            [candidateId]
        );
        return rows;
    }
}

module.exports = Application;

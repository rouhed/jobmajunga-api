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
            `SELECT a.*, jo.title as job_title, jo.contract_type, rp.company_name 
       FROM applications a 
       JOIN job_offers jo ON a.job_offer_id = jo.id 
       JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id 
       WHERE a.candidate_id = ? 
       ORDER BY a.created_at DESC`,
            [candidateId]
        );
        return rows;
    }
}

module.exports = Application;

const pool = require('../config/db');

class Job {
    static async findAll(filters) {
        let query = 'SELECT jo.*, rp.name, rp.photo_url FROM job_offers jo JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id WHERE jo.status = "published"';
        const queryParams = [];

        if (filters.search) {
            query += ' AND (jo.title LIKE ? OR jo.description LIKE ?)';
            queryParams.push(`%${filters.search}%`, `%${filters.search}%`);
        }

        if (filters.type) {
            query += ' AND jo.contract_type = ?';
            queryParams.push(filters.type);
        }

        if (filters.location) {
            query += ' AND jo.location LIKE ?';
            queryParams.push(`%${filters.location}%`);
        }

        if (filters.minSalary) {
            query += ' AND jo.salary_max >= ?';
            queryParams.push(filters.minSalary);
        }

        query += ' ORDER BY jo.created_at DESC';
        const [rows] = await pool.execute(query, queryParams);
        return rows;
    }

    static async findById(id) {
        const query = 'SELECT jo.*, rp.name, rp.photo_url, rp.sector, rp.description as company_desc FROM job_offers jo JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id WHERE jo.id = ?';
        const [rows] = await pool.execute(query, [id]);

        if (rows.length > 0) {
            // Increment views
            await pool.execute('UPDATE job_offers SET views_count = views_count + 1 WHERE id = ?', [id]);
        }

        return rows[0];
    }
}

module.exports = Job;

const pool = require('../config/db');

class Job {
    static async getAll({ search, type, location, minSalary }) {
        let query = 'SELECT jo.*, rp.company_name, rp.logo_url FROM job_offers jo JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id WHERE jo.status = "published"';
        const params = [];

        if (search) {
            query += ' AND (jo.title LIKE ? OR jo.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (type) {
            query += ' AND jo.contract_type = ?';
            params.push(type);
        }

        if (location) {
            query += ' AND jo.location LIKE ?';
            params.push(`%${location}%`);
        }

        if (minSalary) {
            query += ' AND jo.salary_max >= ?';
            params.push(minSalary);
        }

        query += ' ORDER BY jo.created_at DESC';
        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async getById(id) {
        const query = 'SELECT jo.*, rp.company_name, rp.logo_url, rp.sector, rp.description as company_desc FROM job_offers jo JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id WHERE jo.id = ?';
        const [rows] = await pool.execute(query, [id]);

        if (rows.length > 0) {
            // Increment views
            await pool.execute('UPDATE job_offers SET views_count = views_count + 1 WHERE id = ?', [id]);
        }

        return rows[0];
    }
}

module.exports = Job;

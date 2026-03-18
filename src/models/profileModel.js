const pool = require('../config/db');

class Profile {
    static async getByUserId(userId, role) {
        const table = role === 'recruiter' ? 'recruiter_profiles' : 'candidate_profiles';
        const [rows] = await pool.execute(
            `SELECT * FROM ${table} WHERE user_id = ?`,
            [userId]
        );
        return rows[0];
    }

    static async update(userId, role, data) {
        if (role === 'recruiter') {
            const name = data.name ?? null;
            const sector = data.sector ?? null;
            const website = data.website ?? null;
            const description = data.description ?? null;
            const photo_url = data.photo_url ?? null;
            
            await pool.execute(
                `INSERT INTO recruiter_profiles (user_id, name, sector, website, description, photo_url, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                 name = VALUES(name),
                 sector = VALUES(sector),
                 website = VALUES(website),
                 description = VALUES(description),
                 photo_url = IFNULL(VALUES(photo_url), photo_url),
                 updated_at = NOW()`,
                [userId, name, sector, website, description, photo_url]
            );
        } else {
            const firstName = data.first_name ?? null;
            const lastName = data.last_name ?? null;
            const phone = data.phone ?? null;
            const title = data.title ?? null;
            const bio = data.bio ?? null;
            const location = data.location ?? null;
            const photo_url = data.photo_url ?? null;
            await pool.execute(
                `INSERT INTO candidate_profiles (user_id, first_name, last_name, phone, title, bio, location, photo_url, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE 
                 first_name = VALUES(first_name),
                 last_name = VALUES(last_name),
                 phone = VALUES(phone),
                 title = VALUES(title),
                 bio = VALUES(bio),
                 location = VALUES(location),
                 photo_url = IFNULL(VALUES(photo_url), photo_url),
                 updated_at = NOW()`,
                [userId, firstName, lastName, phone, title, bio, location, photo_url]
            );
        }
        return this.getByUserId(userId, role);
    }
}

module.exports = Profile;

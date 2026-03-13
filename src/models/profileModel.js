const pool = require('../config/db');

class Profile {
    static async getByUserId(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM candidate_profiles WHERE user_id = ?',
            [userId]
        );
        return rows[0];
    }

    static async update(userId, data) {
        const { firstName, lastName, phone, title, bio, location } = data;
        await pool.execute(
            `UPDATE candidate_profiles 
       SET first_name = ?, last_name = ?, phone = ?, title = ?, bio = ?, location = ?, updated_at = NOW() 
       WHERE user_id = ?`,
            [firstName, lastName, phone, title, bio, location, userId]
        );
        return this.getByUserId(userId);
    }
}

module.exports = Profile;

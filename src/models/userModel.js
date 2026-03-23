const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async create({ email, password, role }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, role]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT id, email, role, is_active, parent_id FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    static async createSubUser({ email, password, role, parentId }) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, role, parent_id) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, parentId]
        );
        return result.insertId;
    }

    static async createCandidateProfile(userId, { firstName, lastName, phone, title, location }) {
        await pool.execute(
            'INSERT INTO candidate_profiles (user_id, first_name, last_name, phone, title, location) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, firstName || null, lastName || null, phone || null, title || null, location || null]
        );
    }

    static async createRecruiterProfile(userId, data) {
        const { name, sector, website, description } = data;

        await pool.execute(
            'INSERT INTO recruiter_profiles (user_id, name, sector, website, description) VALUES (?, ?, ?, ?, ?)',
            [userId, name || null, sector || null, website || null, description || null]
        );
    }

    static async saveRefreshToken(userId, token, expiresAt) {
        await pool.execute(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );
    }

    static async findRefreshToken(token) {
        const [rows] = await pool.execute('SELECT * FROM refresh_tokens WHERE token = ?', [token]);
        return rows[0];
    }

    static async deleteRefreshToken(token) {
        await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    }
}

module.exports = User;

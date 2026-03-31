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

    static async saveResetCode(email, code) {
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour
        await pool.execute(
            'UPDATE users SET reset_code = ?, reset_code_expires_at = ? WHERE email = ?',
            [code, expiresAt, email]
        );
    }

    static async verifyResetCode(email, code) {
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND reset_code = ? AND reset_code_expires_at > NOW()',
            [email, code]
        );
        return rows[0];
    }

    static async updatePassword(email, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE users SET password = ?, reset_code = NULL, reset_code_expires_at = NULL WHERE email = ?',
            [hashedPassword, email]
        );
    }

    static async findSubRecruiter(adminEmail, subEmail) {
        const [rows] = await pool.execute(`
            SELECT u.* FROM users u
            JOIN users a ON u.parent_id = a.id
            WHERE a.email = ? AND u.email = ? AND u.role = 'recruiter'
        `, [adminEmail, subEmail]);
        return rows[0];
    }
}

module.exports = User;

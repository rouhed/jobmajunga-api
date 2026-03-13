const pool = require('../config/db');

class Notification {
    static async getByUserId(userId, limit = 20) {
        const [rows] = await pool.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
        return rows;
    }

    static async create(userId, type, title, message) {
        await pool.execute(
            'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
            [userId, type, title, message]
        );
    }

    static async markAsRead(id, userId) {
        await pool.execute(
            'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
            [id, userId]
        );
    }

    static async getUnreadCount(userId) {
        const [[result]] = await pool.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false',
            [userId]
        );
        return result.count;
    }
}

module.exports = Notification;

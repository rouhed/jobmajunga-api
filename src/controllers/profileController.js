const Profile = require('../models/profileModel');

const pool = require('../config/db');

exports.getMe = async (req, res) => {
    try {
        const profile = await Profile.getByUserId(req.user.id, req.user.role);
        const [users] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
        if (profile && users.length > 0) {
            profile.email = users[0].email;
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

exports.updateMe = async (req, res) => {
    try {
        if (req.body.email) {
            // Check if email already in use
            const [existingUser] = await pool.execute('SELECT id FROM users WHERE email = ? AND id != ?', [req.body.email, req.user.id]);
            if (existingUser.length > 0) {
                return res.status(400).json({ error: 'Cet email est déjà utilisé' });
            }
            await pool.execute('UPDATE users SET email = ? WHERE id = ?', [req.body.email, req.user.id]);
        }
        
        const profile = await Profile.update(req.user.id, req.user.role, req.body);
        const [users] = await pool.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
        if (profile && users.length > 0) {
            profile.email = users[0].email;
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

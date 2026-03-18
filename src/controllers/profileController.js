const Profile = require('../models/profileModel');

exports.getMe = async (req, res) => {
    try {
        const profile = await Profile.getByUserId(req.user.id, req.user.role);
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const profile = await Profile.update(req.user.id, req.user.role, req.body);
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

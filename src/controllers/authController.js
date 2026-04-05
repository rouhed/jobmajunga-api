const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, role: user.role, parent_id: user.parent_id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
    const { email, password, role, profileData } = req.body;

    try {
        const userExists = await User.findByEmail(email);
        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const userId = await User.create({ email, password, role });

        if (role === 'candidate') {
            await User.createCandidateProfile(userId, profileData);
        } else if (role === 'recruiter') {
            await User.createRecruiterProfile(userId, profileData);
        }

        const user = await User.findById(userId);
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token in DB
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await User.saveRefreshToken(userId, refreshToken, expiresAt);

        res.status(201).json({
            message: 'User registered successfully',
            user,
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('REGISTRATION ERROR:', error);
        res.status(500).json({ error: 'Server error during registration', details: error.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is disabled' });
        }

        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token in DB
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await User.saveRefreshToken(user.id, refreshToken, expiresAt);

        res.json({
            user: { id: user.id, email: user.email, role: user.role, parent_id: user.parent_id },
            accessToken,
            refreshToken
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during login', details: error.message });
    }
};

exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
    try {
        await User.deleteRefreshToken(refreshToken);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error during logout' });
    }
};

exports.refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }

    try {
        const savedToken = await User.findRefreshToken(refreshToken);
        if (!savedToken || new Date() > savedToken.expires_at) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        const tokens = generateTokens(user);

        // Replace old refresh token with new one (optional, but safer)
        await User.deleteRefreshToken(refreshToken);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await User.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);

        res.json(tokens);
    } catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await User.saveResetCode(email, code);
        const EmailService = require('../services/emailService');
        const result = await EmailService.sendResetCode(email, code);

        res.json({ 
            message: result.mock 
                ? 'Mode Test : Code généré. Veuillez consulter les LOGS du serveur sur Render.com.' 
                : 'Un code de réinitialisation a été envoyé à votre adresse email.' 
        });
    } catch (error) {
        console.error('FORGOT PASSWORD ERROR:', error);
        res.status(500).json({ 
            error: 'Server error during forgot password',
            details: error.message,
            stack: error.stack 
        });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, code, password } = req.body;
    try {
        const user = await User.verifyResetCode(email, code);
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        await User.updatePassword(email, password);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error during reset password' });
    }
};

exports.recoverSubUser = async (req, res) => {
    const { admin_email, sub_email } = req.body;
    try {
        const subUser = await User.findSubRecruiter(admin_email, sub_email);
        if (!subUser) {
            return res.status(404).json({ error: 'Collaborateur non trouvé ou non lié à cet administrateur' });
        }

        // Generate a random temporary password
        const tempPassword = Math.random().toString(36).slice(-10);
        await User.updatePassword(sub_email, tempPassword);

        const EmailService = require('../services/emailService');
        const result = await EmailService.sendRecruiterRecoveryToAdmin(admin_email, sub_email, tempPassword);

        res.json({ 
            message: result.mock 
                ? 'Mode Test : Accès générés. Veuillez consulter les LOGS du serveur sur Render.com.' 
                : 'Les accès ont été envoyés par email à l\'administrateur.' 
        });
    } catch (error) {
        console.error('RECOVER SUB USER ERROR:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du collaborateur' });
    }
};

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
            return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
        }
        await User.updatePassword(user.email, newPassword);
        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la modification du mot de passe' });
    }
};

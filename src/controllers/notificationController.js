const Notification = require('../models/notificationModel');

exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.getByUserId(req.user.id);
        const unreadCount = await Notification.getUnreadCount(req.user.id);
        res.json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des notifications' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await Notification.markAsRead(req.params.id, req.user.id);
        res.json({ message: 'Notification marquée comme lue' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
};

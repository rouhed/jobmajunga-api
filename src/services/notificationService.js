const Notification = require('../models/notificationModel');

class NotificationService {
    /**
     * Notify candidate when recruiter updates application status
     */
    static async notifyStatusChange(candidateId, jobTitle, newStatus, details = {}) {
        let title = 'Mise à jour de votre candidature';
        let message = `Votre candidature pour le poste "${jobTitle}" est passée au statut : ${newStatus}.`;

        if (newStatus === 'interview' && details.date) {
            title = '📌 Invitation à un entretien';
            message = `Bonne nouvelle ! Vous êtes invité(e) à un entretien pour le poste "${jobTitle}" le ${newStatus === 'interview' ? details.date : ''}.`;
        } else if (newStatus === 'accepted') {
            title = '🎉 Félicitations !';
            message = `Votre candidature pour "${jobTitle}" a été acceptée par l'entreprise.`;
        } else if (newStatus === 'rejected') {
            title = 'Retour sur votre candidature';
            message = `L'entreprise a décidé de ne pas donner suite à votre candidature pour le poste "${jobTitle}".`;
        }

        await Notification.create(candidateId, 'application_status', title, message);
    }

    /**
     * Notify recruiter when a new candidate applies
     */
    static async notifyNewApplication(recruiterId, jobTitle, candidateName) {
        const title = '🚀 Nouvelle candidature reçue';
        const message = `${candidateName} a postulé pour votre offre : "${jobTitle}".`;
        await Notification.create(recruiterId, 'new_application', title, message);
    }
}

module.exports = NotificationService;

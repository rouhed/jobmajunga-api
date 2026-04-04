const Notification = require('../models/notificationModel');

class NotificationService {
    /**
     * Notify candidate when recruiter updates application status
     */
    static async notifyStatusChange(candidateId, jobTitle, newStatus, details = {}) {
        let title = 'Mise à jour de votre candidature';
        let message = `Votre candidature pour le poste "${jobTitle}" a été mise à jour.`;

        switch (newStatus) {
            case 'interview':
                title = '📌 Invitation à un entretien';
                message = `Bonne nouvelle ! Vous êtes invité(e) à un entretien pour le poste "${jobTitle}"${details.date && details.date !== 'prochainement' ? ` le ${details.date}` : ''}.`;
                break;
            case 'rejected':
                title = 'Retour sur votre candidature';
                message = `L'entreprise a décidé de ne pas donner suite à votre candidature pour le poste "${jobTitle}".`;
                break;
            case 'hired':
                title = '🎉 Offre d\'embauche reçue !';
                message = `Félicitations ! Vous avez reçu une offre d'embauche pour le poste "${jobTitle}"${details.date ? `. Date de début prévue : ${details.date}` : ''}. Veuillez accepter ou refuser dans l'application.`;
                break;
            case 'accepted':
                title = '🎉 Félicitations !';
                message = `Votre candidature pour "${jobTitle}" a été validée définitivement.`;
                break;
            default:
                message = `Le statut de votre candidature pour "${jobTitle}" est : ${newStatus}.`;
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

    /**
     * Generic notification creation (used for recruiter notifications about candidate decisions)
     */
    static async createNotification(userId, message, type = 'general', referenceId = null) {
        const title = type === 'application_update' ? '📬 Décision du Candidat' : 'Notification';
        await Notification.create(userId, type, title, message);
    }
}

module.exports = NotificationService;

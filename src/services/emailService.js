const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = (process.env.EMAIL_USER && process.env.EMAIL_PASS) ? nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
}) : null;

class EmailService {
    static async sendResetCode(email, code) {
        if (!transporter) {
            console.log('=========================================');
            console.log(`[TEST MODE] Reset code for ${email}: ${code}`);
            console.log('=========================================');
            return { mock: true };
        }
        
        const mailOptions = {
            from: `"JobMajunga Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Votre code de réinitialisation JobMajunga',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #0EA5E9;">Réinitialisation de mot de passe</h2>
                    <p>Bonjour,</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe. Voici votre code de vérification :</p>
                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0f172a; margin: 20px 0;">
                        ${code}
                    </div>
                    <p>Ce code est valide pendant 1 heure. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #64748b;">L'équipe JobMajunga</p>
                </div>
            `
        };

        return transporter.sendMail(mailOptions);
    }

    static async sendRecruiterRecoveryToAdmin(adminEmail, subEmail, tempPassword) {
        if (!transporter) {
            console.log('=========================================');
            console.log(`[TEST MODE] Recruiter Recovery for ${subEmail}`);
            console.log(`Admin to notify: ${adminEmail}`);
            console.log(`Temp Password: ${tempPassword}`);
            console.log('=========================================');
            return { mock: true };
        }
        
        const mailOptions = {
            from: `"JobMajunga Support" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `Demande de récupération : ${subEmail}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #0EA5E9;">Récupération de compte Collaborateur</h2>
                    <p>Bonjour Administrateur,</p>
                    <p>Votre collaborateur <strong>${subEmail}</strong> a demandé la récupération de ses accès.</p>
                    <p>Pour des raisons de sécurité, nous avons généré un mot de passe temporaire pour lui :</p>
                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 18px; font-weight: bold; color: #0f172a; margin: 20px 0;">
                        ${tempPassword}
                    </div>
                    <p>Veuillez transmettre ce mot de passe à votre collaborateur. Il pourra le modifier une fois connecté.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #64748b;">L'équipe JobMajunga</p>
                </div>
            `
        };

        return transporter.sendMail(mailOptions);
    }
}

module.exports = EmailService;

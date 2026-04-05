const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterPhotoUrl() {
    console.log("Démarrage de la mise à jour de photo_url...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'jobmajunga',
            ssl: {
                minVersion: 'TLSv1.2',
                rejectUnauthorized: true
            }
        });

        console.log("Connecté à la base de données. Modification des colonnes photo_url...");
        
        await connection.query("ALTER TABLE candidate_profiles MODIFY COLUMN photo_url LONGTEXT;");
        console.log("✅ candidate_profiles modifié (photo_url devient LONGTEXT)");

        await connection.query("ALTER TABLE recruiter_profiles MODIFY COLUMN photo_url LONGTEXT;");
        console.log("✅ recruiter_profiles modifié (photo_url devient LONGTEXT)");

        await connection.end();
        console.log("Terminé avec succès !");
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
    }
}

alterPhotoUrl();

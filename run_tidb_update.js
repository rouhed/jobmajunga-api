const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateTiDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });

        console.log("Connecté à TiDB en ligne.");

        // We use CHANGE to safely rename the columns without losing data
        console.log("Renommage de company_name -> name...");
        await connection.query('ALTER TABLE recruiter_profiles CHANGE company_name name VARCHAR(200) NOT NULL;');
        
        console.log("Renommage de logo_url -> photo_url...");
        await connection.query('ALTER TABLE recruiter_profiles CHANGE logo_url photo_url VARCHAR(500);');

        console.log("Mise à jour réussie sur la BDD en ligne !");
        await connection.end();
    } catch (err) {
        console.error("Erreur :", err);
        
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.message.includes("Unknown column")) {
            console.log("Les colonnes sont probablement déjà renommées !");
        }
    }
}
updateTiDB();

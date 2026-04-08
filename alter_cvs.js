const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterCvsTable() {
    console.log("Migration pour la table CVS...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'jobmajunga',
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });

        console.log("Connecté. Ajout des colonnes file_url et cv_type...");
        
        // Add cv_type
        try {
            await connection.query("ALTER TABLE cvs ADD COLUMN cv_type ENUM('builder', 'pdf') DEFAULT 'builder';");
            console.log("✅ get cv_type ajouté.");
        } catch (e) {
            console.log("⚠️ cv_type existe peut-être déjà :", e.message);
        }

        // Add file_url
        try {
            await connection.query("ALTER TABLE cvs ADD COLUMN file_url LONGTEXT;");
            console.log("✅ file_url ajouté.");
        } catch (e) {
            console.log("⚠️ file_url existe peut-être déjà :", e.message);
        }

        await connection.end();
        console.log("Migration terminée avec succès.");

    } catch (error) {
        console.error("Erreur de connexion :", error);
    }
}

alterCvsTable();

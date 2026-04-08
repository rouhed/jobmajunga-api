const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateCvs() {
    console.log("Migration CV : ajout colonnes manquantes...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'jobmajunga',
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });

        // Add color_theme
        try {
            await connection.query("ALTER TABLE cvs ADD COLUMN color_theme VARCHAR(20) DEFAULT '#2563EB';");
            console.log("✅ color_theme ajouté.");
        } catch (e) {
            console.log("⚠️ color_theme existe déjà :", e.message);
        }

        // Add is_default
        try {
            await connection.query("ALTER TABLE cvs ADD COLUMN is_default BOOLEAN DEFAULT FALSE;");
            console.log("✅ is_default ajouté.");
        } catch (e) {
            console.log("⚠️ is_default existe déjà :", e.message);
        }

        // Check if template_name exists, if not try to rename template_id
        try {
            const [cols] = await connection.query("SHOW COLUMNS FROM cvs LIKE 'template_name'");
            if (cols.length === 0) {
                // No template_name, check template_id
                const [cols2] = await connection.query("SHOW COLUMNS FROM cvs LIKE 'template_id'");
                if (cols2.length > 0) {
                    await connection.query("ALTER TABLE cvs CHANGE template_id template_name VARCHAR(50) DEFAULT 'modern';");
                    console.log("✅ template_id renommé en template_name.");
                } else {
                    await connection.query("ALTER TABLE cvs ADD COLUMN template_name VARCHAR(50) DEFAULT 'modern';");
                    console.log("✅ template_name ajouté.");
                }
            } else {
                console.log("⚠️ template_name existe déjà.");
            }
        } catch (e) {
            console.log("⚠️ Erreur template_name :", e.message);
        }

        await connection.end();
        console.log("Migration terminée !");

    } catch (error) {
        console.error("Erreur de migration :", error);
    }
}

migrateCvs();

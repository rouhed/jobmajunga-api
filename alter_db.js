const mysql = require('mysql2/promise');
require('dotenv').config();

async function alterDB() {
    console.log("Démarrage de la mise à jour de la base de données...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'jobmajunga',
            port: process.env.DB_PORT || 3306,
            ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
        });

        console.log("Connecté à la base de données.");
        console.log("Passage de la colonne status de la table applications en VARCHAR(50)...");
        
        await connection.query("ALTER TABLE applications MODIFY COLUMN status VARCHAR(50) DEFAULT 'sent';");
        
        console.log("Mise à jour réussie ! La base de données supporte maintenant tous les statuts textuels.");
        await connection.end();
    } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
    }
}

alterDB();

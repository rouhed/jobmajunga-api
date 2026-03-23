const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined
        });

        console.log("Connecté à la BDD...");

        try {
            console.log("Adding parent_id to users...");
            await connection.query('ALTER TABLE users ADD COLUMN parent_id INT NULL DEFAULT NULL;');
            console.log("parent_id added successfully");
        } catch(e) {
            console.error("Error adding parent_id (might exist):", e.message);
        }

        try {
            console.log("Adding foreign key fk_user_parent...");
            await connection.query('ALTER TABLE users ADD CONSTRAINT fk_user_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;');
            console.log("Foreign key added successfully");
        } catch(e) {
            console.error("Error adding fk (might exist):", e.message);
        }

        console.log("Migration terminée !");
        await connection.end();
    } catch (err) {
        console.error("Erreur de connexion :", err);
    }
}
runMigration();

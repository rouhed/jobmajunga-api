const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'jobmajunga',
        port: process.env.DB_PORT || 3306,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    console.log("Adding recovery columns to 'users' table...");

    try {
        await connection.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_code VARCHAR(10) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS reset_code_expires_at TIMESTAMP NULL DEFAULT NULL;
        `);
        console.log("SUCCESS: Columns added.");
    } catch (error) {
        console.error("MIGRATION ERROR:", error.message);
    } finally {
        await connection.end();
    }
}
migrate();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
    try {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { minVersion: 'TLSv1.2' }
        });

        console.log("Connected to TiDB. Checking columns for recruiter_profiles...");
        const [rows] = await pool.execute('SHOW COLUMNS FROM recruiter_profiles');
        console.log("Columns:");
        rows.forEach(r => console.log(`- ${r.Field} (${r.Type})`));

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
checkDB();

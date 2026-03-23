const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkData() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        ssl: {
            minVersion: 'TLSv1.2',
            rejectUnauthorized: true
        }
    });

    try {
        const [jobs] = await pool.execute('SELECT * FROM job_offers ORDER BY id DESC LIMIT 1');
        console.log('--- LATEST JOB DATA ---');
        const job = jobs[0];
        for (const key in job) {
            const val = String(job[key]);
            console.log(`${key}: ${val.substring(0, 50)}${val.length > 50 ? '...' : ''} (length: ${val.length})`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkData();

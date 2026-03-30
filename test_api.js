const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
});

app.get('/test', async (req, res) => {
    try {
        const companyId = 1187185;
        const [rows] = await pool.execute(
            `SELECT jo.*, u.email as publisher_email, u.role as publisher_role, rp.photo_url as company_logo
             FROM job_offers jo 
             LEFT JOIN users u ON jo.created_by_user_id = u.id 
             LEFT JOIN recruiter_profiles rp ON jo.recruiter_id = rp.user_id
             WHERE jo.recruiter_id = ? 
             ORDER BY jo.created_at DESC`,
            [companyId]
        );
        res.json(rows);
    } catch (error) {
        console.error('BIG ERROR:', error);
        res.status(500).json({ error: 'Erreur' });
    }
});

const server = app.listen(0, async () => {
    console.log('PORT:', server.address().port);
    const http = require('http');
    http.get('http://localhost:' + server.address().port + '/test', (r) => {
        let d = '';
        r.on('data', c => d+=c);
        r.on('end', () => {
            console.log('STATUS:', r.statusCode);
            console.log('DATA:', d.substring(0, 500));
            process.exit(0);
        });
    });
});

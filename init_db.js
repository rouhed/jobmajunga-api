const mysql = require('mysql2/promise');
require('dotenv').config();

// Script to drop, recreate, and initialize the JobMajunga database based exactly on Cahier de charge.txt
async function initDB() {
    console.log("Démarrage de la réinitialisation de la base de données...");

    try {
        // Connect without a specific db to drop and create the database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            multipleStatements: true
        });

        console.log("Connecté au serveur MySQL. Suppression de l'ancienne base...");
        await connection.query('DROP DATABASE IF EXISTS jobmajunga;');
        
        console.log("Création de la nouvelle base de données 'jobmajunga'...");
        await connection.query('CREATE DATABASE jobmajunga CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
        await connection.query('USE jobmajunga;');

        console.log("Création des tables selon le Cahier des Charges...");

        const sqlScript = `
        -- TABLE : users
        CREATE TABLE users (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('candidate', 'recruiter', 'admin') NOT NULL DEFAULT 'candidate',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        -- TABLE : candidate_profiles
        CREATE TABLE candidate_profiles (
          user_id INT UNSIGNED PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          phone VARCHAR(30),
          title VARCHAR(200),
          location VARCHAR(150),
          bio TEXT,
          photo_url VARCHAR(500),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        -- TABLE : recruiter_profiles
        CREATE TABLE recruiter_profiles (
          user_id INT UNSIGNED PRIMARY KEY,
          company_name VARCHAR(200) NOT NULL,
          logo_url VARCHAR(500),
          description TEXT,
          website VARCHAR(300),
          sector VARCHAR(100),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        -- TABLE : job_offers
        CREATE TABLE job_offers (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          recruiter_id INT UNSIGNED NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          contract_type ENUM('CDI', 'CDD', 'Freelance', 'Stage', 'Alternance') NOT NULL,
          location VARCHAR(150),
          latitude DECIMAL(10,8),
          longitude DECIMAL(11,8),
          salary_min DECIMAL(10,2),
          salary_max DECIMAL(10,2),
          category VARCHAR(100),
          skills JSON,
          status ENUM('draft', 'published', 'expired', 'archived') DEFAULT 'draft',
          views_count INT UNSIGNED DEFAULT 0,
          expires_at DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE,
          FULLTEXT INDEX ft_jobs (title, description)
        );
        
        -- TABLE : cvs
        CREATE TABLE cvs (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          candidate_id INT UNSIGNED NOT NULL,
          title VARCHAR(255) NOT NULL,
          template_id VARCHAR(50) DEFAULT 'classic',
          color_theme VARCHAR(20) DEFAULT '#2563EB',
          is_public BOOLEAN DEFAULT FALSE,
          public_token VARCHAR(36) UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        -- TABLE : cv_sections
        CREATE TABLE cv_sections (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          cv_id INT UNSIGNED NOT NULL,
          section_type ENUM('summary', 'experience', 'education', 
            'skills', 'languages', 'certifications', 
            'projects', 'interests') NOT NULL,
          display_order TINYINT UNSIGNED DEFAULT 0,
          is_visible BOOLEAN DEFAULT TRUE,
          content JSON NOT NULL,
          FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
        );
        
        -- TABLE : applications
        CREATE TABLE applications (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          candidate_id INT UNSIGNED NOT NULL,
          job_offer_id INT UNSIGNED NOT NULL,
          cv_id INT UNSIGNED NOT NULL,
          cover_letter TEXT,
          status ENUM('sent', 'viewed', 'reviewing', 
            'interview', 'accepted', 'rejected') DEFAULT 'sent',
          recruiter_notes TEXT,
          interview_date DATETIME,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_application (candidate_id, job_offer_id),
          FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
          FOREIGN KEY (cv_id) REFERENCES cvs(id)
        );
        
        -- TABLE : refresh_tokens
        CREATE TABLE refresh_tokens (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          token VARCHAR(512) NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        -- INDEX de performance
        CREATE INDEX idx_jobs_status ON job_offers(status);
        CREATE INDEX idx_jobs_recruiter ON job_offers(recruiter_id);
        CREATE INDEX idx_jobs_location ON job_offers(location);
        CREATE INDEX idx_apps_candidate ON applications(candidate_id);
        CREATE INDEX idx_apps_job ON applications(job_offer_id);
        CREATE INDEX idx_apps_status ON applications(status);
        CREATE INDEX idx_cvs_candidate ON cvs(candidate_id);
        `;

        await connection.query(sqlScript);
        console.log("Toutes les tables ont été créées avec succès !");

        await connection.end();
        console.log("Base de données prête à l'emploi. Vous pouvez relancer le serveur !");

    } catch (error) {
        console.error("Erreur lors de l'initialisation de la base de données :", error);
    }
}

initDB();

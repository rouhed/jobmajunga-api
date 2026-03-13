-- DROP TABLES TO ALLOW EASY RE-IMPORT
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS cv_sections;
DROP TABLE IF EXISTS cvs;
DROP TABLE IF EXISTS job_offers;
DROP TABLE IF EXISTS recruiter_profiles;
DROP TABLE IF EXISTS candidate_profiles;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

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
  contract_type VARCHAR(50) NOT NULL,
  location VARCHAR(150),
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  requirements TEXT,
  required_skills JSON,
  status VARCHAR(50) DEFAULT 'published',
  views_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recruiter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE : cvs
CREATE TABLE cvs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  template_name VARCHAR(50) DEFAULT 'modern',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE : cv_sections
CREATE TABLE cv_sections (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cv_id INT UNSIGNED NOT NULL,
  section_type VARCHAR(50) NOT NULL,
  content JSON NOT NULL,
  FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
);

-- TABLE : applications
CREATE TABLE applications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT UNSIGNED NOT NULL,
  job_offer_id INT UNSIGNED NOT NULL,
  cv_id INT UNSIGNED NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_offer_id) REFERENCES job_offers(id) ON DELETE CASCADE,
  FOREIGN KEY (cv_id) REFERENCES cvs(id)
);

-- TABLE : notifications
CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE : refresh_tokens
CREATE TABLE refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- INDEX de performance
CREATE INDEX idx_jobs_status ON job_offers(status);
CREATE INDEX idx_jobs_recruiter ON job_offers(recruiter_id);
CREATE INDEX idx_apps_candidate ON applications(candidate_id);
CREATE INDEX idx_apps_job ON applications(job_offer_id);
CREATE INDEX idx_notifs_user ON notifications(user_id);

const pool = require('../config/db');

class CV {
    static async getAllByUserId(userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM cvs WHERE candidate_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        return rows;
    }

    static async getById(cvId, userId) {
        const [[cv]] = await pool.execute(
            'SELECT * FROM cvs WHERE id = ? AND candidate_id = ?',
            [cvId, userId]
        );
        return cv;
    }

    static async create(userId, data) {
        const { title, templateName, cvType, fileUrl } = data;
        const [result] = await pool.execute(
            'INSERT INTO cvs (candidate_id, title, template_id, cv_type, file_url) VALUES (?, ?, ?, ?, ?)',
            [userId, title, templateName || 'modern', cvType || 'builder', fileUrl || null]
        );
        return { id: result.insertId, ...data };
    }

    static async update(cvId, userId, data) {
        const { title, templateName, isDefault, cvType, fileUrl, colorTheme } = data;
        await pool.execute(
            'UPDATE cvs SET title = ?, template_id = ?, is_default = ?, cv_type = ?, file_url = ?, color_theme = ? WHERE id = ? AND candidate_id = ?',
            [title, templateName || 'modern', isDefault ? 1 : 0, cvType || 'builder', fileUrl || null, colorTheme || '#2563EB', cvId, userId]
        );
        return { id: cvId, ...data };
    }

    static async delete(cvId, userId) {
        const client = await pool.getConnection();
        try {
            await client.beginTransaction();
            // Secure delete by checking candidate_id first
            const [cv] = await client.execute('SELECT id FROM cvs WHERE id = ? AND candidate_id = ?', [cvId, userId]);
            if (cv.length === 0) throw new Error('CV not found or unauthorized');

            await client.execute('DELETE FROM cv_sections WHERE cv_id = ?', [cvId]);
            await client.execute('DELETE FROM applications WHERE cv_id = ?', [cvId]);
            await client.execute('DELETE FROM cvs WHERE id = ?', [cvId]);
            await client.commit();
        } catch (error) {
            await client.rollback();
            throw error;
        } finally {
            client.release();
        }
    }

    static async getSections(cvId) {
        const [rows] = await pool.execute(
            'SELECT * FROM cv_sections WHERE cv_id = ? ORDER BY id',
            [cvId]
        );
        return rows.map(row => ({
            ...row,
            content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content
        }));
    }

    static async updateSections(cvId, sections) {
        // Simple strategy: delete and re-insert for sections update
        const client = await pool.getConnection();
        try {
            await client.beginTransaction();
            await client.execute('DELETE FROM cv_sections WHERE cv_id = ?', [cvId]);
            for (const section of sections) {
                await client.execute(
                    'INSERT INTO cv_sections (cv_id, section_type, content) VALUES (?, ?, ?)',
                    [cvId, section.section_type, JSON.stringify(section.content)]
                );
            }
            await client.commit();
        } catch (error) {
            await client.rollback();
            throw error;
        } finally {
            client.release();
        }
    }

    static async duplicate(cvId, userId) {
        const cv = await this.getById(cvId, userId);
        if (!cv) throw new Error('CV not found');

        const sections = await this.getSections(cvId);

        const newCv = await this.create(userId, {
            title: `${cv.title} (Copie)`,
            templateName: cv.template_name
        });

        await this.updateSections(newCv.id, sections);
        return newCv;
    }
}

module.exports = CV;

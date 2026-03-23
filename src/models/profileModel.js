const pool = require('../config/db');

class Profile {
    static async getByUserId(userId, role) {
        const table = role === 'recruiter' ? 'recruiter_profiles' : 'candidate_profiles';
        const [rows] = await pool.execute(
            `SELECT * FROM ${table} WHERE user_id = ?`,
            [userId]
        );
        return rows[0];
    }

    static async update(userId, role, data) {
        console.log(`[Profile.update] userId=${userId}, role=${role}, data=`, JSON.stringify(data));
        
        if (role === 'recruiter') {
            const name = data.name ?? null;
            const sector = data.sector ?? null;
            const website = data.website ?? null;
            const description = data.description ?? null;
            const photo_url = data.photo_url ?? null;
            
            // Check if profile already exists
            const [existing] = await pool.execute(
                'SELECT user_id FROM recruiter_profiles WHERE user_id = ?',
                [userId]
            );
            
            if (existing.length > 0) {
                // UPDATE existing profile
                const updateFields = [];
                const updateValues = [];
                
                if (name !== null && name !== undefined) { updateFields.push('name = ?'); updateValues.push(name); }
                if (sector !== null && sector !== undefined) { updateFields.push('sector = ?'); updateValues.push(sector); }
                if (website !== null && website !== undefined) { updateFields.push('website = ?'); updateValues.push(website); }
                if (description !== null && description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
                if (photo_url !== null && photo_url !== undefined) { updateFields.push('photo_url = ?'); updateValues.push(photo_url); }
                
                if (updateFields.length > 0) {
                    updateValues.push(userId);
                    await pool.execute(
                        `UPDATE recruiter_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
                        updateValues
                    );
                }
            } else {
                // INSERT new profile
                await pool.execute(
                    `INSERT INTO recruiter_profiles (user_id, name, sector, website, description, photo_url)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, name, sector, website, description, photo_url]
                );
            }
        } else {
            const firstName = data.first_name ?? null;
            const lastName = data.last_name ?? null;
            const phone = data.phone ?? null;
            const title = data.title ?? null;
            const bio = data.bio ?? null;
            const location = data.location ?? null;
            const photo_url = data.photo_url ?? null;
            
            // Check if profile already exists
            const [existing] = await pool.execute(
                'SELECT user_id FROM candidate_profiles WHERE user_id = ?',
                [userId]
            );
            
            if (existing.length > 0) {
                // UPDATE existing profile
                await pool.execute(
                    `UPDATE candidate_profiles SET 
                     first_name = COALESCE(?, first_name),
                     last_name = COALESCE(?, last_name),
                     phone = COALESCE(?, phone),
                     title = COALESCE(?, title),
                     bio = COALESCE(?, bio),
                     location = COALESCE(?, location),
                     photo_url = COALESCE(?, photo_url)
                     WHERE user_id = ?`,
                    [firstName, lastName, phone, title, bio, location, photo_url, userId]
                );
            } else {
                // INSERT new profile
                await pool.execute(
                    `INSERT INTO candidate_profiles (user_id, first_name, last_name, phone, title, bio, location, photo_url)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [userId, firstName, lastName, phone, title, bio, location, photo_url]
                );
            }
        }
        return this.getByUserId(userId, role);
    }
}

module.exports = Profile;

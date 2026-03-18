const pool = require('./src/config/db');

async function checkRyadData() {
    try {
        const userId = 1127183; // Ryad's ID found earlier
        console.log(`Checking data for user ID: ${userId}`);
        
        const [jobs] = await pool.execute("SELECT COUNT(*) as count FROM job_offers WHERE recruiter_id = ?", [userId]);
        console.log(`Job offers: ${jobs[0].count}`);
        
        const [apps] = await pool.execute(
            "SELECT COUNT(*) as count FROM applications a JOIN job_offers jo ON a.job_offer_id = jo.id WHERE jo.recruiter_id = ?", 
            [userId]
        );
        console.log(`Applications received: ${apps[0].count}`);

        const [profile] = await pool.execute("SELECT * FROM recruiter_profiles WHERE user_id = ?", [userId]);
        console.log("Recruiter Profile in DB:", JSON.stringify(profile[0], null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkRyadData();

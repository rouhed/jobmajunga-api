const pool = require('./src/config/db');

async function checkUserData() {
    try {
        const email = 'ryad@gmail.com';
        console.log(`Checking data for user: ${email}`);
        
        const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) {
            console.log("User not found.");
            process.exit(0);
        }
        
        const user = users[0];
        console.log("User found:", JSON.stringify({ id: user.id, email: user.email, role: user.role }));
        
        const [profiles] = await pool.execute("SELECT * FROM recruiter_profiles WHERE user_id = ?", [user.id]);
        if (profiles.length === 0) {
            console.log("Recruiter profile MISSING for this user!");
        } else {
            console.log("Profile found:", JSON.stringify(profiles[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkUserData();

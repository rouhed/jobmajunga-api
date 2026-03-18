const pool = require('./src/config/db');

async function checkSchema() {
    try {
        console.log("Checking recruiter_profiles structure...");
        const [columns] = await pool.execute("DESCRIBE recruiter_profiles");
        console.log(JSON.stringify(columns, null, 2));
        
        console.log("\nChecking candidate_profiles structure...");
        const [candColumns] = await pool.execute("DESCRIBE candidate_profiles");
        console.log(JSON.stringify(candColumns, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkSchema();

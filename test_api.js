const axios = require('axios');

async function testApi() {
    try {
        console.log("1. Logging in...");
        const loginRes = await axios.post('https://jobmajunga-api.onrender.com/api/v1/auth/login', {
            email: 'ami@gmail.com', // fallback credentials, hopefully one exists
            password: 'password123'
        }).catch(err => {
            console.log("Failed ami. Trying kwan@gmail.com...");
            return axios.post('https://jobmajunga-api.onrender.com/api/v1/auth/login', {
                email: 'kwan@gmail.com',
                password: 'password123'
            });
        });

        const token = loginRes.data.token;
        console.log("Logged in! Token acquired. Testing profile update...");

        const updateRes = await axios.put('https://jobmajunga-api.onrender.com/api/v1/recruiter/profile', {
            name: "TEST NAME ROUHED",
            sector: "TEST SECTOR",
            website: "",
            description: "",
            photo_url: null
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("SUCCESS! API returned:", updateRes.status);
        console.log(updateRes.data);
    } catch (err) {
        console.error("API Error Status:", err.response?.status);
        console.error(err.response?.data);
    }
}
testApi();

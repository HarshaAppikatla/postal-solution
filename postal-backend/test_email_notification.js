const axios = require('axios');

async function testComplaint() {
    try {
        console.log("Creating complaint for userId: 1");
        const res = await axios.post('http://localhost:5000/api/complaint', {
            text: "Testing email notification logic.",
            user: "Test User",
            userId: 1, // Assuming user with ID 1 exists
            location: "Test Location"
        });
        console.log("Complaint Created ID:", res.data.id);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testComplaint();

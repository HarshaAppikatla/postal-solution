const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:5000/api/complaint', {
            text: "damaged product i recieved",
            user: "Test",
            userId: 1
        });
        console.log("Response:", res.data);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

test();

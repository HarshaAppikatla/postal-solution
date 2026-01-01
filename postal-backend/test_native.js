const http = require('http');

const data = JSON.stringify({
    text: "Testing email notification logic for specific user.",
    user: "Vitanala Sai Kushal",
    userId: 1766180658187
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/complaint',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (d) => { data += d; });
    res.on('end', () => {
        try {
            console.log(JSON.stringify(JSON.parse(data), null, 2));
        } catch (e) {
            console.log(data);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();

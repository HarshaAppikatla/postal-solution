const express = require('express');
const cors = require('cors');
const Sentiment = require('sentiment');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');
const POSTMEN_FILE = path.join(__dirname, 'postmen.json');

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

// --- PERSISTENCE ---
let users = [];
let complaints = [];

const loadData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            users = data.users || [];
            complaints = data.complaints || [];
            console.log(`[DATA] Loaded ${users.length} users and ${complaints.length} complaints.`);
        } else {
            console.log("No data file.");
            users = [];
            complaints = [];
        }
    } catch (err) { console.error("Error loading data:", err); }
};

const saveData = () => {
    try { fs.writeFileSync(DATA_FILE, JSON.stringify({ users, complaints }, null, 2)); }
    catch (err) { console.error("Error saving data:", err); }
};

loadData();

// --- POSTMEN LOGIC ---
const getPostmenData = () => {
    if (fs.existsSync(POSTMEN_FILE)) return JSON.parse(fs.readFileSync(POSTMEN_FILE));
    return [];
};

app.get('/api/postmen/assigned', (req, res) => {
    const { email } = req.query;
    console.log(`[DEBUG] Fetching Assigned Postman for Email: ${email}`);

    const postmen = getPostmenData();
    if (postmen.length === 0) return res.json([]);

    let hash = 0;
    const key = email || "default";
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % postmen.length;

    const assignedPostman = {
        ...postmen[index],
        dist: 0.8 / 111
    };

    res.json([assignedPostman]);
});

app.get('/api/postmen', (req, res) => {
    res.json(getPostmenData());
});

// --- AUTH ---
app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    const user = users.find(u => u.email === email);
    if (user) res.json({ success: true, user });
    else res.json({ success: false });
});

// --- COMPLAINTS ---
app.post('/api/complaints', (req, res) => {
    const { userId, user, text, image, lat, lng } = req.body;
    const newTicket = {
        id: Date.now(),
        userId, user, text, image, lat, lng,
        category: "Others", priority: "Low", status: "Submitted",
        timestamp: new Date().toISOString(),
        statusHistory: [{ status: "Submitted", time: new Date().toISOString(), note: "Received via App" }]
    };

    const lower = text.toLowerCase();
    if (lower.includes('lost') || lower.includes('missing')) { newTicket.category = 'Lost Package'; newTicket.priority = 'High'; }

    complaints.push(newTicket);
    saveData();
    res.json(newTicket);
});

app.get('/api/complaints/user/:userId', (req, res) => {
    res.json(complaints.filter(c => c.userId == req.params.userId && c.isVisibleToUser !== false));
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`SmartPost V2 Running on ${PORT}`));

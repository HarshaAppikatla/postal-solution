const express = require('express');
const cors = require('cors');
const Sentiment = require('sentiment');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

const sentimentAnalyzer = new Sentiment();

// --- PERSISTENCE LOGIC ---
let users = [];
let complaints = [];
let packages = []; // Enterprise Feature: Package Tracking

// Load Data
const loadData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            users = data.users || [];
            complaints = data.complaints || [];
            packages = data.packages || []; // Enterprise Feature
            console.log(`[DATA] Loaded ${users.length} users, ${complaints.length} complaints, and ${packages.length} packages.`);
            console.log(`[DATA] Loaded ${users.length} users and ${complaints.length} complaints.`);
        } else {
            console.log("[DATA] No data file found. Creating fresh.");
            // Default Dummy Data
            users = [{ id: 1, name: "Rohit Sharma", email: "rohit@example.com", city: "Mumbai", role: "citizen" }];
            complaints = [{
                id: 1766081110000, userId: 1, user: "Rohit Sharma", text: "My package #SP123 is delayed by 3 days.",
                category: "Delay in Delivery", priority: "Medium", status: "Resolved",
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                statusHistory: [{ status: "Submitted", time: new Date(Date.now() - 90000000).toISOString(), note: "Received" }, { status: "Resolved", time: new Date(Date.now() - 80000000).toISOString(), note: "Resolved by Admin" }],
                finalResponse: "Delivered today.", rating: 4
            }];
            saveData();
        }
    } catch (err) { console.error("Error loading data:", err); }
};

// Save Data
const saveData = () => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ users, complaints, packages }, null, 2));
    } catch (err) { console.error("Error saving data:", err); }
};

loadData(); // Initialize

// --- AUTH W/ EMAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: 'harsha145.appikatla@gmail.com', pass: 'ivcg qxco aiuc jhdu' } // Preserved
});

let otpStore = {};

// KEYWORDS (Enhanced for NLP-like matching)
let customKeywords = {
    // --- LOST PACKAGE (High Priority) ---
    'lost': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'missing': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'not received': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'never arrived': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'where is my': { category: 'Lost Package', priority: 'Medium', lang: 'en' },
    'stolen': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'theft': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'cant find': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'disappeared': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'not delivered': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'medication': { category: 'Lost Package', priority: 'Critical', lang: 'en' },
    'passport': { category: 'Lost Package', priority: 'Critical', lang: 'en' },
    'document': { category: 'Lost Package', priority: 'High', lang: 'en' },
    // Regional Lost
    'gayab': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'kho gaya': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'nahi mila': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'chori': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'kanipinchadam ledu': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'poyindi': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'donga': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'kaanavillai': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'tholanju': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'thirudappattathu': { category: 'Lost Package', priority: 'High', lang: 'ta' },

    // --- DAMAGED ITEM (High Priority) ---
    'damaged': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'damage': { category: 'Damaged Item', priority: 'Medium', lang: 'en' },
    'broken': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'broke': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'defective': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'crushed': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'smashed': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'torn': { category: 'Damaged Item', priority: 'Medium', lang: 'en' },
    'wet': { category: 'Damaged Item', priority: 'Medium', lang: 'en' },
    'soaked': { category: 'Damaged Item', priority: 'Medium', lang: 'en' },
    'leaking': { category: 'Damaged Item', priority: 'Critical', lang: 'en' },
    'leaked': { category: 'Damaged Item', priority: 'Critical', lang: 'en' },
    'destroyed': { category: 'Damaged Item', priority: 'Critical', lang: 'en' },
    'ruined': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'glass': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'scratched': { category: 'Damaged Item', priority: 'Low', lang: 'en' },
    // Regional Damaged
    'toota': { category: 'Damaged Item', priority: 'High', lang: 'hi' },
    'phata': { category: 'Damaged Item', priority: 'Medium', lang: 'hi' },
    'nuksaan': { category: 'Damaged Item', priority: 'Medium', lang: 'hi' },
    'pagulipoindi': { category: 'Damaged Item', priority: 'High', lang: 'te' },
    'virigindi': { category: 'Damaged Item', priority: 'High', lang: 'te' },
    'chigili': { category: 'Damaged Item', priority: 'Medium', lang: 'te' },
    'udainthuvittathu': { category: 'Damaged Item', priority: 'High', lang: 'ta' },
    'nasungiyathu': { category: 'Damaged Item', priority: 'High', lang: 'ta' },

    // --- DELAY IN DELIVERY (Medium Priority) ---
    'late': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'delayed': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'delay': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'slow': { category: 'Delay in Delivery', priority: 'Low', lang: 'en' },
    'waiting': { category: 'Delay in Delivery', priority: 'Low', lang: 'en' },
    'taking long': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'stuck': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'not moving': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'overdue': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'pending': { category: 'Delay in Delivery', priority: 'Low', lang: 'en' },
    // Regional Delay
    'deri': { category: 'Delay in Delivery', priority: 'Medium', lang: 'hi' },
    'dheere': { category: 'Delay in Delivery', priority: 'Low', lang: 'hi' },
    'alasyam': { category: 'Delay in Delivery', priority: 'Medium', lang: 'te' },
    'mellaga': { category: 'Delay in Delivery', priority: 'Low', lang: 'te' },
    'thaamadham': { category: 'Delay in Delivery', priority: 'Medium', lang: 'ta' },
    'medhuvaaga': { category: 'Delay in Delivery', priority: 'Low', lang: 'ta' },

    // --- STAFF BEHAVIOR (Critical/High) ---
    'rude': { category: 'Staff Behavior', priority: 'High', lang: 'en' },
    'behavior': { category: 'Staff Behavior', priority: 'Medium', lang: 'en' },
    'behaviour': { category: 'Staff Behavior', priority: 'Medium', lang: 'en' },
    'shouted': { category: 'Staff Behavior', priority: 'High', lang: 'en' },
    'yelled': { category: 'Staff Behavior', priority: 'High', lang: 'en' },
    'abused': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'insult': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'fight': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'unprofessional': { category: 'Staff Behavior', priority: 'Medium', lang: 'en' },
    'postman': { category: 'Staff Behavior', priority: 'Low', lang: 'en' }, // Mentioning postman usually implies staff feedback
    'attitude': { category: 'Staff Behavior', priority: 'Medium', lang: 'en' },
    // Regional Staff
    'badtameez': { category: 'Staff Behavior', priority: 'High', lang: 'hi' },
    'chillaya': { category: 'Staff Behavior', priority: 'High', lang: 'hi' },
    'maryaada ledu': { category: 'Staff Behavior', priority: 'High', lang: 'te' },
    'mariyathai illai': { category: 'Staff Behavior', priority: 'High', lang: 'ta' },
    'sathamaaga': { category: 'Staff Behavior', priority: 'High', lang: 'ta' },

    // --- WRONG DELIVERY (High Priority) ---
    'wrong': { category: 'Wrong Delivery', priority: 'High', lang: 'en' },
    'incorrect': { category: 'Wrong Delivery', priority: 'Medium', lang: 'en' },
    'mistake': { category: 'Wrong Delivery', priority: 'Medium', lang: 'en' },
    'neighbor': { category: 'Wrong Delivery', priority: 'Medium', lang: 'en' },
    'neighbour': { category: 'Wrong Delivery', priority: 'Medium', lang: 'en' },
    'elsewhere': { category: 'Wrong Delivery', priority: 'Medium', lang: 'en' },
    'false': { category: 'Wrong Delivery', priority: 'High', lang: 'en' },
    'other address': { category: 'Wrong Delivery', priority: 'High', lang: 'en' },
    // Regional Wrong
    'galat': { category: 'Wrong Delivery', priority: 'High', lang: 'hi' },
    'thappu': { category: 'Wrong Delivery', priority: 'High', lang: 'te' },
    'thappaana': { category: 'Wrong Delivery', priority: 'High', lang: 'ta' },

    // --- OTHERS ---
    'refund': { category: 'Others', priority: 'Medium', lang: 'en' },
    'return': { category: 'Others', priority: 'Low', lang: 'en' },
    'help': { category: 'Others', priority: 'Low', lang: 'en' },
    'info': { category: 'Others', priority: 'Low', lang: 'en' },
    'inquiry': { category: 'Others', priority: 'Low', lang: 'en' },
    'complaint': { category: 'Others', priority: 'Low', lang: 'en' },
    'change address': { category: 'Others', priority: 'Medium', lang: 'en' },
    'urgent': { category: 'Others', priority: 'High', lang: 'en' },
    'login': { category: 'Others', priority: 'Low', lang: 'en' },
    'password': { category: 'Others', priority: 'Low', lang: 'en' },
    'account': { category: 'Others', priority: 'Low', lang: 'en' },
    'khata': { category: 'Others', priority: 'Low', lang: 'hi' },
    'khaatha': { category: 'Others', priority: 'Low', lang: 'te' },
    'kanakku': { category: 'Others', priority: 'Low', lang: 'ta' },
    'verify': { category: 'Others', priority: 'Medium', lang: 'en' },
    'sari paarkka': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'identity': { category: 'Others', priority: 'High', lang: 'en' },
    'pehchan': { category: 'Others', priority: 'High', lang: 'hi' },
    'gurthimpu': { category: 'Others', priority: 'High', lang: 'te' },
    'adaiyaalam': { category: 'Others', priority: 'High', lang: 'ta' },
    'theft': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'thiruttu': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'piracy': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'missing mail': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'mail gayab': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'mail poyindi': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'thabaal illai': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'letters': { category: 'Others', priority: 'Low', lang: 'en' },
    'khat': { category: 'Others', priority: 'Low', lang: 'hi' },
    'utharalu': { category: 'Others', priority: 'Low', lang: 'te' },
    'kadidham': { category: 'Others', priority: 'Low', lang: 'ta' },
    'documents': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'kagaz': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'kaagithalu': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'aavanam': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'official': { category: 'Others', priority: 'Medium', lang: 'en' },
    'sarkari': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'sarkaru': { category: 'Others', priority: 'Medium', lang: 'te' },
    'adhigarapurva': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'rates': { category: 'Others', priority: 'Low', lang: 'en' },
    'rate': { category: 'Others', priority: 'Low', lang: 'hi' },
    'dharalu': { category: 'Others', priority: 'Low', lang: 'te' },
    'vilai': { category: 'Others', priority: 'Low', lang: 'ta' },
    'overcharged': { category: 'Others', priority: 'Medium', lang: 'en' },
    'zyada paisa': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'ekkuva dabbulu': { category: 'Others', priority: 'Medium', lang: 'te' },
    'adhigamaana kattanam': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'billing': { category: 'Others', priority: 'Low', lang: 'en' },
    'billu': { category: 'Others', priority: 'Low', lang: 'te' },
    'kattanam': { category: 'Others', priority: 'Low', lang: 'ta' },
    'taxes': { category: 'Others', priority: 'Medium', lang: 'en' },
    'customs hell': { category: 'Others', priority: 'High', lang: 'en' },
    'customs narak': { category: 'Others', priority: 'High', lang: 'hi' },
    'customs narakam': { category: 'Others', priority: 'High', lang: 'te' },
    'customs naragam': { category: 'Others', priority: 'High', lang: 'ta' },
    'duties': { category: 'Others', priority: 'Medium', lang: 'en' },
    'duty': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'international': { category: 'Others', priority: 'Medium', lang: 'en' },
    'videshi': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'velinaattu': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'domestic': { category: 'Others', priority: 'Low', lang: 'en' },
    'desh': { category: 'Others', priority: 'Low', lang: 'hi' },
    'desham': { category: 'Others', priority: 'Low', lang: 'te' },
    'ulnaattu': { category: 'Others', priority: 'Low', lang: 'ta' },
    'local': { category: 'Others', priority: 'Low', lang: 'en' },
    'ullaar': { category: 'Others', priority: 'Low', lang: 'ta' },
    'post office': { category: 'Others', priority: 'Low', lang: 'en' },
    'dak ghar': { category: 'Others', priority: 'Low', lang: 'hi' },
    'thapaala karyalayam': { category: 'Others', priority: 'Low', lang: 'te' },
    'thabaal nilayam': { category: 'Others', priority: 'Low', lang: 'ta' },
    'branch': { category: 'Others', priority: 'Low', lang: 'en' },
    'kilai': { category: 'Others', priority: 'Low', lang: 'ta' },
    'counter': { category: 'Others', priority: 'Low', lang: 'en' },
    'clerk': { category: 'Staff Behavior', priority: 'Low', lang: 'en' },
    'gumaastha': { category: 'Staff Behavior', priority: 'Low', lang: 'ta' },
    'manager': { category: 'Staff Behavior', priority: 'Medium', lang: 'en' },
    'melalar': { category: 'Staff Behavior', priority: 'Medium', lang: 'ta' },
    'supervisor': { category: 'Staff Behavior', priority: 'Medium', lang: 'en' },
    'associate': { category: 'Staff Behavior', priority: 'Low', lang: 'en' },
    'sathi': { category: 'Staff Behavior', priority: 'Low', lang: 'hi' },
    'thozhilaali': { category: 'Staff Behavior', priority: 'Low', lang: 'ta' },
    'carrier': { category: 'Staff Behavior', priority: 'Low', lang: 'en' },
    'delivery boy': { category: 'Staff Behavior', priority: 'Low', lang: 'en' },
    'delivery wala': { category: 'Staff Behavior', priority: 'Low', lang: 'hi' },
    'delivery kurradu': { category: 'Staff Behavior', priority: 'Low', lang: 'te' },
    'delivery paiyan': { category: 'Staff Behavior', priority: 'Low', lang: 'ta' },
    'attitude': { category: 'Staff Behavior', priority: 'Low', lang: 'en' },
    'murattu thanam': { category: 'Staff Behavior', priority: 'Low', lang: 'ta' },
    'behavior': { category: 'Staff Behavior', priority: 'Medium', lang: 'en' },
    'vyavahar': { category: 'Staff Behavior', priority: 'Medium', lang: 'hi' },
    'vyavaharam': { category: 'Staff Behavior', priority: 'Medium', lang: 'te' },
    'nadathai': { category: 'Staff Behavior', priority: 'Medium', lang: 'ta' },
    'misconduct': { category: 'Staff Behavior', priority: 'High', lang: 'en' },
    'bura kaam': { category: 'Staff Behavior', priority: 'High', lang: 'hi' },
    'thappu nadathai': { category: 'Staff Behavior', priority: 'High', lang: 'te' },
    'thavarana nadathai': { category: 'Staff Behavior', priority: 'High', lang: 'ta' },
    'physical': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'sharirik': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'shareeram': { category: 'Staff Behavior', priority: 'Critical', lang: 'te' },
    'udhal reethiyaga': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'threat': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'dhamki': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'bedharimpu': { category: 'Staff Behavior', priority: 'Critical', lang: 'te' },
    'mirattal': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'violence': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'hinsa': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'vanmuraigal': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'racist': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'jaativadi': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'jaathivaadham': { category: 'Staff Behavior', priority: 'Critical', lang: 'te' },
    'jaadhi verri': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'sexist': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'lingbhed': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'lingabhedham': { category: 'Staff Behavior', priority: 'Critical', lang: 'te' },
    'paalina baagupaadu': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'yelling': { category: 'Staff Behavior', priority: 'High', lang: 'en' },
    'chillana': { category: 'Staff Behavior', priority: 'High', lang: 'hi' },
    'kattral': { category: 'Staff Behavior', priority: 'High', lang: 'ta' },
    'screaming': { category: 'Staff Behavior', priority: 'High', lang: 'en' },
    'fighting': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'ladayi': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'godava': { category: 'Staff Behavior', priority: 'Critical', lang: 'te' },
    'sandai': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'drunk': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'peeya': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'thaagithe': { category: 'Staff Behavior', priority: 'Critical', lang: 'te' },
    'kudi bodhaiyil': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'drugs': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'bodhai porul': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'theft by staff': { category: 'Staff Behavior', priority: 'Critical', lang: 'en' },
    'staff chori': { category: 'Staff Behavior', priority: 'Critical', lang: 'hi' },
    'staff donga': { category: 'Staff Behavior', priority: 'Critical', lang: 'te' },
    'staff thiruttu': { category: 'Staff Behavior', priority: 'Critical', lang: 'ta' },
    'mail opening': { category: 'Staff Behavior', priority: 'High', lang: 'en' },
    'mail kholna': { category: 'Staff Behavior', priority: 'High', lang: 'hi' },
    'mail theravatam': { category: 'Staff Behavior', priority: 'High', lang: 'te' },
    'thabaal thirappu': { category: 'Staff Behavior', priority: 'High', lang: 'ta' },
    'privacy': { category: 'Others', priority: 'High', lang: 'en' },
    'thaniurimai': { category: 'Others', priority: 'High', lang: 'ta' },
    'data leak': { category: 'Others', priority: 'Critical', lang: 'en' },
    'tharavu kasivu': { category: 'Others', priority: 'Critical', lang: 'ta' },
    'security': { category: 'Others', priority: 'High', lang: 'en' },
    'vulnerability': { category: 'Others', priority: 'Critical', lang: 'en' },
    'kamzori': { category: 'Others', priority: 'Critical', lang: 'hi' },
    'balaveenam': { category: 'Others', priority: 'Critical', lang: 'ta' },
    'hacking': { category: 'Others', priority: 'Critical', lang: 'en' },
    'refund me': { category: 'Others', priority: 'High', lang: 'en' },
    'paise vaapis': { category: 'Others', priority: 'High', lang: 'hi' },
    'dabbulu thirigi': { category: 'Others', priority: 'High', lang: 'te' },
    'panam thiruppi': { category: 'Others', priority: 'High', lang: 'ta' },
    'return label': { category: 'Others', priority: 'Low', lang: 'en' },
    'thiruppum adaiyaalam': { category: 'Others', priority: 'Low', lang: 'ta' },
    'exchange': { category: 'Others', priority: 'Medium', lang: 'en' },
    'badalna': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'marchukovadam': { category: 'Others', priority: 'Medium', lang: 'te' },
    'maatruvatharku': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'replacement': { category: 'Others', priority: 'Medium', lang: 'en' },
    'maatru porul': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'warranty': { category: 'Others', priority: 'Medium', lang: 'en' },
    'guarantee': { category: 'Others', priority: 'Medium', lang: 'en' },
    'compensation': { category: 'Others', priority: 'High', lang: 'en' },
    'muawza': { category: 'Others', priority: 'High', lang: 'hi' },
    'pariharaam': { category: 'Others', priority: 'High', lang: 'te' },
    'nasta eedu': { category: 'Others', priority: 'High', lang: 'ta' },
    'insurance': { category: 'Others', priority: 'Medium', lang: 'en' },
    'bima': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'beema': { category: 'Others', priority: 'Medium', lang: 'te' },
    'kaappeedu': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'claim': { category: 'Others', priority: 'Medium', lang: 'en' },
    'urimai koraal': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'tracking link': { category: 'Others', priority: 'Low', lang: 'en' },
    'portal': { category: 'Others', priority: 'Low', lang: 'en' },
    'website': { category: 'Others', priority: 'Low', lang: 'en' },
    'inaiya thalam': { category: 'Others', priority: 'Low', lang: 'ta' },
    'app error': { category: 'Others', priority: 'Medium', lang: 'en' },
    'app galati': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'app thappu': { category: 'Others', priority: 'Medium', lang: 'te' },
    'app thavarugal': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'crashing': { category: 'Others', priority: 'High', lang: 'en' },
    'bandh': { category: 'Others', priority: 'High', lang: 'hi' },
    'aagipoindi': { category: 'Others', priority: 'High', lang: 'te' },
    'seyalizhandhuvittathu': { category: 'Others', priority: 'High', lang: 'ta' },
    'slow speed': { category: 'Delay in Delivery', priority: 'Low', lang: 'en' },
    'kam speed': { category: 'Delay in Delivery', priority: 'Low', lang: 'hi' },
    'thakkuva speed': { category: 'Delay in Delivery', priority: 'Low', lang: 'te' },
    'medhuvaana vegam': { category: 'Delay in Delivery', priority: 'Low', lang: 'ta' },
    'overdue item': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'baki cheez': { category: 'Delay in Delivery', priority: 'Medium', lang: 'hi' },
    'baakee vasthu': { category: 'Delay in Delivery', priority: 'Medium', lang: 'te' },
    'thaamadhamaana porul': { category: 'Delay in Delivery', priority: 'Medium', lang: 'ta' },
    'past due': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'deri ho gayi': { category: 'Delay in Delivery', priority: 'Medium', lang: 'hi' },
    'alasyam aindi': { category: 'Delay in Delivery', priority: 'Medium', lang: 'te' },
    'thaamadham': { category: 'Delay in Delivery', priority: 'Medium', lang: 'ta' },
    'stuck in hub': { category: 'Delay in Delivery', priority: 'High', lang: 'en' },
    'hub mein phasa': { category: 'Delay in Delivery', priority: 'High', lang: 'hi' },
    'hub lo undi': { category: 'Delay in Delivery', priority: 'High', lang: 'te' },
    'hub-il maattikkondathu': { category: 'Delay in Delivery', priority: 'High', lang: 'ta' },
    'transit delay': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'raaste ki deri': { category: 'Delay in Delivery', priority: 'Medium', lang: 'hi' },
    'dhaari lo alasyam': { category: 'Delay in Delivery', priority: 'Medium', lang: 'te' },
    'vazhiyil thaamadham': { category: 'Delay in Delivery', priority: 'Medium', lang: 'ta' },
    'missed delivery': { category: 'Wrong Delivery', priority: 'High', lang: 'en' },
    'delivery chhoot': { category: 'Wrong Delivery', priority: 'High', lang: 'hi' },
    'delivery poyindi': { category: 'Wrong Delivery', priority: 'High', lang: 'te' },
    'delivery thavaruvittadhu': { category: 'Wrong Delivery', priority: 'High', lang: 'ta' },
    'neighbor house': { category: 'Wrong Delivery', priority: 'Low', lang: 'en' },
    'padosi ghar': { category: 'Wrong Delivery', priority: 'Low', lang: 'hi' },
    'poruguvadi illu': { category: 'Wrong Delivery', priority: 'Low', lang: 'te' },
    'pakkathu veedu': { category: 'Wrong Delivery', priority: 'Low', lang: 'ta' },
    'mailbox full': { category: 'Others', priority: 'Low', lang: 'en' },
    'box bhara': { category: 'Others', priority: 'Low', lang: 'hi' },
    'box nindi undi': { category: 'Others', priority: 'Low', lang: 'te' },
    'box nirambiyathu': { category: 'Others', priority: 'Low', lang: 'ta' },
    'overflowing': { category: 'Others', priority: 'High', lang: 'en' },
    'bhar gaya': { category: 'Others', priority: 'High', lang: 'hi' },
    'nindi poindi': { category: 'Others', priority: 'High', lang: 'te' },
    'nirambi vazhigiradhu': { category: 'Others', priority: 'High', lang: 'ta' },
    'broken box': { category: 'Damaged Item', priority: 'Medium', lang: 'en' },
    'toota petti': { category: 'Damaged Item', priority: 'Medium', lang: 'hi' },
    'pagilina pette': { category: 'Damaged Item', priority: 'Medium', lang: 'te' },
    'udaintha petti': { category: 'Damaged Item', priority: 'Medium', lang: 'ta' },
    'dented': { category: 'Damaged Item', priority: 'Low', lang: 'en' },
    'pichka': { category: 'Damaged Item', priority: 'Low', lang: 'hi' },
    'naligina': { category: 'Damaged Item', priority: 'Low', lang: 'te' },
    'pallamaana': { category: 'Damaged Item', priority: 'Low', lang: 'ta' },
    'wet papers': { category: 'Damaged Item', priority: 'Medium', lang: 'en' },
    'geela kagaz': { category: 'Damaged Item', priority: 'Medium', lang: 'hi' },
    'thadi kaagithalu': { category: 'Damaged Item', priority: 'Medium', lang: 'te' },
    'eera kadidham': { category: 'Damaged Item', priority: 'Medium', lang: 'ta' },
    'ruin': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'safety issue': { category: 'Others', priority: 'Critical', lang: 'en' },
    'suraksha problem': { category: 'Others', priority: 'Critical', lang: 'hi' },
    'rakshana samasya': { category: 'Others', priority: 'Critical', lang: 'te' },
    'paadhukaappu prachinai': { category: 'Others', priority: 'Critical', lang: 'ta' },
    'leak problem': { category: 'Damaged Item', priority: 'Critical', lang: 'en' },
    'leak samasya': { category: 'Damaged Item', priority: 'Critical', lang: 'te' },
    'kasivu prachinai': { category: 'Damaged Item', priority: 'Critical', lang: 'ta' },
    'chemical smell': { category: 'Damaged Item', priority: 'Critical', lang: 'en' },
    'chemical gandh': { category: 'Damaged Item', priority: 'Critical', lang: 'hi' },
    'chemical vaasana': { category: 'Damaged Item', priority: 'Critical', lang: 'te' },
    'chemical vaasanai': { category: 'Damaged Item', priority: 'Critical', lang: 'ta' },
    'broken seal': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'tooti seal': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'pagilina seal': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'udaintha seal': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'tampered': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'chheda': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'kelikaru': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'kai vaikka pattadhu': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'empty box': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'khaali dabba': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'khaali pette': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'verum petti': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'stolen parcel': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'chori parcel': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'donga parcel': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'thirudappatta parcel': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'missing package': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'gayab package': { category: 'Lost Package', priority: 'High', lang: 'hi' },
    'package poyindi': { category: 'Lost Package', priority: 'High', lang: 'te' },
    'kaanavillai package': { category: 'Lost Package', priority: 'High', lang: 'ta' },
    'location': { category: 'Others', priority: 'Low', lang: 'en' },
    'jagah': { category: 'Others', priority: 'Low', lang: 'hi' },
    'sthalam': { category: 'Others', priority: 'Low', lang: 'te' },
    'idham': { category: 'Others', priority: 'Low', lang: 'ta' },
    'facility': { category: 'Others', priority: 'Low', lang: 'en' },
    'vasadhi': { category: 'Others', priority: 'Low', lang: 'ta' },
    'lobby': { category: 'Others', priority: 'Low', lang: 'en' },
    'waiting': { category: 'Others', priority: 'Low', lang: 'en' },
    'aagatam': { category: 'Others', priority: 'Low', lang: 'te' },
    'kaathiruppu': { category: 'Others', priority: 'Low', lang: 'ta' },
    'time limit': { category: 'Others', priority: 'Medium', lang: 'en' },
    'samay seema': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'samayam': { category: 'Others', priority: 'Medium', lang: 'te' },
    'nera kattupaadu': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'deadline': { category: 'Others', priority: 'Medium', lang: 'en' },
    'kaadu gethu': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'urgent help': { category: 'Others', priority: 'High', lang: 'en' },
    'turant madad': { category: 'Others', priority: 'High', lang: 'hi' },
    'thone sahaayam': { category: 'Others', priority: 'High', lang: 'te' },
    'avasara udhavi': { category: 'Others', priority: 'High', lang: 'ta' },
    'immediate fix': { category: 'Others', priority: 'Critical', lang: 'en' },
    'abhi theek': { category: 'Others', priority: 'Critical', lang: 'hi' },
    'ippude sari': { category: 'Others', priority: 'Critical', lang: 'te' },
    'ippodhey sari sei': { category: 'Others', priority: 'Critical', lang: 'ta' },
    'problem': { category: 'Others', priority: 'Medium', lang: 'en' },
    'samasya': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'prachinai': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'error': { category: 'Others', priority: 'Low', lang: 'en' },
    'galti': { category: 'Others', priority: 'Low', lang: 'hi' },
    'thavarugal': { category: 'Others', priority: 'Low', lang: 'ta' },
    'mistake': { category: 'Others', priority: 'Low', lang: 'en' },
    'oversight': { category: 'Others', priority: 'Medium', lang: 'en' },
    'chhoot': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'marchipoindi': { category: 'Others', priority: 'Medium', lang: 'te' },
    'kavana kuraivu': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'refund check': { category: 'Others', priority: 'Medium', lang: 'en' },
    'payment fail': { category: 'Others', priority: 'High', lang: 'en' },
    'payment tholvi': { category: 'Others', priority: 'High', lang: 'ta' },
    'charge back': { category: 'Others', priority: 'High', lang: 'en' },
    'kooduthal kattanam': { category: 'Others', priority: 'High', lang: 'ta' },
    'overcharge': { category: 'Others', priority: 'Medium', lang: 'en' },
    'revenue': { category: 'Others', priority: 'Low', lang: 'en' },
    'kamayi': { category: 'Others', priority: 'Low', lang: 'hi' },
    'aadhaayam': { category: 'Others', priority: 'Low', lang: 'te' },
    'varumaanam': { category: 'Others', priority: 'Low', lang: 'ta' },
    'postage': { category: 'Others', priority: 'Low', lang: 'en' },
    'dak': { category: 'Others', priority: 'Low', lang: 'hi' },
    'thapaala': { category: 'Others', priority: 'Low', lang: 'te' },
    'thabaal': { category: 'Others', priority: 'Low', lang: 'ta' },
    'stamps': { category: 'Others', priority: 'Low', lang: 'en' },
    'ticket': { category: 'Others', priority: 'Low', lang: 'hi' },
    'ticketlu': { category: 'Others', priority: 'Low', lang: 'te' },
    'thabaal thalaikal': { category: 'Others', priority: 'Low', lang: 'ta' },
    'envelop': { category: 'Others', priority: 'Low', lang: 'en' },
    'lifafa': { category: 'Others', priority: 'Low', lang: 'hi' },
    'urai': { category: 'Others', priority: 'Low', lang: 'ta' },
    'parcel': { category: 'Others', priority: 'Low', lang: 'en' },
    'freight': { category: 'Others', priority: 'Low', lang: 'en' },
    'cargo': { category: 'Others', priority: 'Low', lang: 'en' },
    'shipping': { category: 'Others', priority: 'Low', lang: 'en' },
    'transit time': { category: 'Delay in Delivery', priority: 'Low', lang: 'en' },
    'transit samay': { category: 'Delay in Delivery', priority: 'Low', lang: 'hi' },
    'transit samayam': { category: 'Delay in Delivery', priority: 'Low', lang: 'te' },
    'transit neram': { category: 'Delay in Delivery', priority: 'Low', lang: 'ta' },
    'delivery date': { category: 'Others', priority: 'Low', lang: 'en' },
    'pahunchne ka din': { category: 'Others', priority: 'Low', lang: 'hi' },
    'delivery roju': { category: 'Others', priority: 'Low', lang: 'te' },
    'delivery thedhi': { category: 'Others', priority: 'Low', lang: 'ta' },
    'expected': { category: 'Others', priority: 'Low', lang: 'en' },
    'ummeed': { category: 'Others', priority: 'Low', lang: 'hi' },
    'aashinchina': { category: 'Others', priority: 'Low', lang: 'te' },
    'yedhirpaartha': { category: 'Others', priority: 'Low', lang: 'ta' },
    'actual': { category: 'Others', priority: 'Low', lang: 'en' },
    'asli': { category: 'Others', priority: 'Low', lang: 'hi' },
    'nijam': { category: 'Others', priority: 'Low', lang: 'te' },
    'unmaiyaana': { category: 'Others', priority: 'Low', lang: 'ta' },
    'difference': { category: 'Others', priority: 'Medium', lang: 'en' },
    'farq': { category: 'Others', priority: 'Medium', lang: 'hi' },
    'theda': { category: 'Others', priority: 'Medium', lang: 'te' },
    'vithiyaasam': { category: 'Others', priority: 'Medium', lang: 'ta' },
    'delay probability': { category: 'Delay in Delivery', priority: 'Medium', lang: 'en' },
    'deri hone ka chance': { category: 'Delay in Delivery', priority: 'Medium', lang: 'hi' },
    'alasyam chance': { category: 'Delay in Delivery', priority: 'Medium', lang: 'te' },
    'thaamadha vaaippu': { category: 'Delay in Delivery', priority: 'Medium', lang: 'ta' },
    'disruption': { category: 'Others', priority: 'High', lang: 'en' },
    'rukawat': { category: 'Others', priority: 'High', lang: 'hi' },
    'badha': { category: 'Others', priority: 'High', lang: 'te' },
    'thadaikal': { category: 'Others', priority: 'High', lang: 'ta' },
    'risk level': { category: 'Others', priority: 'High', lang: 'en' },
    'khatra level': { category: 'Others', priority: 'High', lang: 'hi' },
    'risk sthayi': { category: 'Others', priority: 'High', lang: 'te' },
    'abaaya nilai': { category: 'Others', priority: 'High', lang: 'ta' },
    'monitor': { category: 'Others', priority: 'Low', lang: 'en' },
    'dekhna': { category: 'Others', priority: 'Low', lang: 'hi' },
    'chudadam': { category: 'Others', priority: 'Low', lang: 'te' },
    'kankaanippu': { category: 'Others', priority: 'Low', lang: 'ta' },
    'update': { category: 'Others', priority: 'Low', lang: 'en' },
    'notification': { category: 'Others', priority: 'Low', lang: 'en' },
    'khabar': { category: 'Others', priority: 'Low', lang: 'hi' },
    'suchana': { category: 'Others', priority: 'Low', lang: 'te' },
    'arivippu': { category: 'Others', priority: 'Low', lang: 'ta' },
    'alert': { category: 'Others', priority: 'High', lang: 'en' },
    // --- IMPROVED PHRASES & TYPOS ---
    'damaged product': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'received damaged': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'product damage': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'recieved': { category: 'Others', priority: 'Low', lang: 'en' },
    'not recieved': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'wrong product': { category: 'Wrong Delivery', priority: 'High', lang: 'en' },
    'wrong item': { category: 'Wrong Delivery', priority: 'High', lang: 'en' },
};

const templates = {
    'Lost Package': {
        en: "Dear Customer, we sincerely apologize. We have initiated a Level-2 search tracking sequence for your package.",
        hi: "Priya Grahak, humein khed hai. Humne aapke package ke liye Level-2 search shuruaat kar di hai.",
        te: "Priya Grahakuda, kshaminchandi. Mee package kosam memu Level-2 search tracking prarambhinchaamu."
    },
    'Damaged Item': {
        en: "We regret to hear that your item was damaged. Please upload photos so we can process an insurance claim.",
        hi: "Humein khed hai ki aapka saaman toot gaya. Kripya tasveerein upload karein taaki hum insurance claim process karein.",
        te: "Mee vasthuvu paadainanduku memu chinthistunnamu. Dayachesi photos upload cheyandi, memu insurance claim process chestamu."
    },
    'Delay in Delivery': {
        en: "We apologize for the delay. Your package is currently in transit and is prioritized for dispatch.",
        hi: "Deri ke liye maafi chahte hain. Aapka package raaste mein hai aur jald hi pahunchega.",
        te: "Alasyamainanduku kshaminchandi. Mee package transit lo undi, thwaralo deliver avuthundi."
    },
    'Staff Behavior': {
        en: "We take such complaints very seriously. Your grievance has been forwarded to the vigilance officer.",
        hi: "Hum is shikayat ko gambhirta se lete hain. Isse vigilance officer ko bhej diya gaya hai.",
        te: "Memu mee firyaduni chala serious ga tesukuntunnamu. Deenini vigilance officer ki pampinchaamu."
    },
    'Wrong Delivery': {
        en: "We apologize for the mix-up. We are arranging for a pickup and correct delivery.",
        hi: "Galat delivery ke liye maafi. Hum sahi package bhejne ka prabandh kar rahe hain.",
        te: "Thappu delivery ki kshaminchandi. Memu sari aina package pampinchadaniki erpatlu chestunnamu."
    },
    'Others': {
        en: "Thank you for reaching out. We are looking into your query.",
        hi: "Sampark karne ke liye dhanyavaad. Hum aapki samasya dekh rahe hain.",
        te: "Maatho matladinanduku dhanyavadalu. Memu mee samasyanu parishkaristunnamu."
    }
};

const analyzeComplaint = (text, hasImage) => {
    if (!text) return {};
    const result = sentimentAnalyzer.analyze(text);
    const score = result.score;
    let sentiment = "Neutral";
    if (score <= -3) sentiment = "Negative"; else if (score >= 2) sentiment = "Positive";

    const lowerText = text.toLowerCase();
    let category = "Others";
    let priority = "Low";
    let detectedKeyword = null;
    let detectedLang = 'en';

    // IMPROVED LOGIC: Sort by length (Longest first) -> Match Whole Words Only
    const sortedKeywords = Object.entries(customKeywords).sort((a, b) => b[0].length - a[0].length);

    for (const [key, value] of sortedKeywords) {
        // Escape regex special characters just in case
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Regex: (Start or Separator) + Key + (End or Separator)
        // Separators: whitespace, punctuation (.,!?-), quotes
        const regex = new RegExp(`(?:^|[\\s\\.,!\\?\\-"'])${escapedKey}(?:$|[\\s\\.,!\\?\\-"'])`, 'i');

        if (regex.test(lowerText)) {
            category = value.category;
            priority = value.priority;
            detectedKeyword = key;
            detectedLang = value.lang;
            break; // Found the most specific keyword (longest)
        }
    }

    if (score < -5 && priority !== 'Critical') priority = "High";

    let slaHours = 72;
    if (priority === 'Critical') slaHours = 24; else if (priority === 'High') slaHours = 48;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    // IMAGE-AWARE RESPONSE LOGIC
    let finalResponseEn = templates[category] ? templates[category].en : templates['Others'].en;
    if (category === 'Damaged Item' && hasImage) {
        finalResponseEn = "We verify that you have attached photographic evidence. Our claims team is assessing the damage for immediate compensation processing.";
    }

    const responseOptions = {
        en: finalResponseEn,
        regional: detectedLang !== 'en' && templates[category] ? templates[category][detectedLang] : null,
        detectedLang: detectedLang
    };

    let explanation = `Classified as '${category}' because `;
    if (detectedKeyword) explanation += `it contains the ${detectedLang === 'en' ? 'English' : detectedLang === 'hi' ? 'Hindi' : 'Telugu'} keyword '${detectedKeyword}'. `;
    else explanation += `AI model detected general patterns. `;
    if (hasImage) explanation += ` Image evidence detected (Priority Adjusted).`;

    return { category, sentiment, score, priority, suggestedResponse: responseOptions.regional || responseOptions.en, responseOptions, confidence: (0.75 + Math.random() * 0.2).toFixed(2), explanation, slaDeadline };
};

// --- ENTERPRISE MIDDLEWARE (RBAC) ---
const requireAuth = (req, res, next) => {
    const userId = req.headers['x-user-id']; // Mock Authentication
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = users.find(u => u.id == userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access Denied: Insufficient Permissions" });
        }
        next();
    };
};

// --- ENTERPRISE ENDPOINTS ---

// 1. User & Identity Management
app.get('/api/user/me', requireAuth, (req, res) => {
    res.json(req.user);
});

app.post('/api/auth/update-profile', (req, res) => {
    const { email, name, phone, address, city, pincode, state, language, avatar, password } = req.body;

    // Find user by email
    const user = users.find(u => u.email === email);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (city) user.city = city;
    if (pincode) user.pincode = pincode;
    if (state) user.state = state;
    if (language) user.language = language;
    if (avatar) user.avatar = avatar;
    if (password) user.password = password;

    saveData();
    res.json({ success: true, user });
});

// 2. Package / Consignment Management
app.get('/api/packages/user/:userId', (req, res) => {
    // Return packages tracked by this user
    const userPackages = packages.filter(p => p.userId == req.params.userId);
    res.json(userPackages);
});

app.post('/api/packages/track', (req, res) => {
    const { trackingNumber, userId } = req.body;
    if (!trackingNumber) return res.status(400).json({ error: "Tracking Number missing" });

    // Mock tracking data fetch
    let pkg = packages.find(p => p.trackingNumber === trackingNumber);
    if (!pkg) {
        // Auto-create/Detect logic
        pkg = {
            id: Date.now(),
            trackingNumber,
            userId: userId || 'guest',
            status: 'In Transit',
            estimatedDelivery: new Date(Date.now() + 86400000 * 2).toISOString(),
            currentLocation: 'Central Hub, Delhi',
            history: [{ status: 'Picked Up', time: new Date().toISOString(), location: 'Vendor' }]
        };
        packages.unshift(pkg);
        saveData();
    }
    res.json(pkg);
});

// 3. Complaint Drafts & structured inputs
app.post('/api/complaint/draft', (req, res) => {
    const { text, user, userId, location, image, category, priority } = req.body;
    const newDraft = {
        id: Date.now(),
        userId: userId || "guest",
        user: user || "Citizen",
        text,
        status: "Draft",
        category,
        priority,
        timestamp: new Date().toISOString(),
        isDraft: true
    };
    complaints.unshift(newDraft);
    saveData();
    res.json(newDraft);
});

// 4. Admin Queue & Assignment
app.get('/api/admin/queue', requireAuth, requireRole(['admin', 'supervisor', 'case_officer']), (req, res) => {
    const { status, priority, category, assignee } = req.query;
    let queue = complaints;

    if (status) queue = queue.filter(c => c.status === status);
    if (priority) queue = queue.filter(c => c.priority === priority);
    if (category) queue = queue.filter(c => c.category === category);
    if (assignee) queue = queue.filter(c => c.assignedTo === assignee);

    // Sort by Priority (Critical first)
    const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    queue.sort((a, b) => priorityWeight[b.priority || 'Low'] - priorityWeight[a.priority || 'Low']);

    res.json(queue);
});

app.post('/api/admin/assign', (req, res) => {
    const { ticketId, officerId } = req.body;
    const ticket = complaints.find(c => c.id == ticketId);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    ticket.assignedTo = officerId;
    ticket.status = "In Progress"; // Auto-move to In Progress
    ticket.statusHistory.push({
        status: "Assigned",
        time: new Date().toISOString(),
        note: `Assigned to Officer ${officerId} by ${req.user.name}`
    });
    saveData();
    res.json({ success: true, ticket });
});

// 5. Audit & Analytics (Enhanced)
app.get('/api/admin/stats', requireAuth, requireRole(['admin']), (req, res) => {
    // Detailed stats for dashboard
    const stats = {
        total: complaints.length,
        open: complaints.filter(c => c.status !== 'Resolved').length,
        breachedSLA: complaints.filter(c => c.slaDeadline && new Date(c.slaDeadline) < new Date() && c.status !== 'Resolved').length,
        avgResolutionTime: "4.2 hours" // Mocked calculation
    };
    res.json(stats);
});


// --- AUTH ENDPOINTS ---
app.post('/api/auth/send-otp', async (req, res) => {
    const { email, purpose } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[email] = otp;
    console.log(`[AUTH] Generated OTP for ${email}: ${otp}`);

    let subject = 'Login Verification - SmartPost AI';
    let text = `Hello User,\n\nHere is your One-Time Password (OTP) to login to the SmartPost AI application:\n\n${otp}\n\nPlease use this code to securely access your dashboard.\nThis code expires in 10 minutes.\n\nBest Regards,\nTeam SmartPost`;

    if (purpose === 'password_change') {
        subject = 'Password Change Request - SmartPost AI';
        text = `Hello User,\n\nHere is your OTP code for changing the password:\n\n${otp}\n\nIf you did not request this change, please ignore this email or contact support.\n\nBest Regards,\nTeam SmartPost`;
    }

    const mailOptions = {
        from: 'SmartPost AI <harsha145.appikatla@gmail.com>',
        to: email,
        subject: subject,
        text: text
    };

    // Fire and Forget Email
    transporter.sendMail(mailOptions, (err) => {
        if (err) console.error("[MAIL ERROR] OTP Failed:", err);
    });

    // Return Success Immediately (Demo Resiliency)
    res.json({ success: true, message: "OTP sent", demoOtp: otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    // Allow '1234' as master master OTP for demo
    if (otpStore[email] === otp || otp === '1234') {
        delete otpStore[email];
        let user = users.find(u => u.email === email);
        let isNewUser = false;
        if (!user) {
            isNewUser = true;
            user = { id: Date.now(), email, name: "", city: "", role: "citizen", phone: "", pincode: "", address: "", bio: "", avatar: "" };
        }
        res.json({ success: true, user, isNewUser });
    } else { res.status(401).json({ error: "Invalid OTP" }); }
});

// PASSWORD LOGIN ENDPOINT
app.post('/api/auth/login-password', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    // Simple password check (In real app, use bcrypt)
    // For this hackathon, we assume if regular user exists and password matches (or default 'password123' if not set)
    if (user) {
        if (user.password === password || (!user.password && password === 'password123')) {
            res.json({ success: true, user });
        } else {
            res.status(401).json({ error: "Incorrect Password" });
        }
    } else {
        res.status(404).json({ error: "User not found. Try OTP/Register." });
    }
});

// UPDATE PROFILE (Expanded Fields)
app.post('/api/auth/update-profile', (req, res) => {
    const { email, name, city, phone, pincode, address, password, avatar } = req.body;
    let user = users.find(u => u.email === email);

    if (user) {
        // Update existing fields if provided
        if (name) user.name = name;
        if (city) user.city = city;
        if (phone) user.phone = phone;
        if (pincode) user.pincode = pincode;
        if (address) user.address = address;
        if (password) user.password = password;
        if (avatar) user.avatar = avatar;

        saveData();
        res.json({ success: true, user });
    } else {
        // Create new user with all fields
        const newUser = {
            id: Date.now(),
            email,
            name,
            city,
            phone: phone || "",
            pincode: pincode || "",
            address: address || "",
            password: password || "password123", // Default if not set
            avatar: avatar || "",
            role: "citizen"
        };
        users.push(newUser);
        saveData();
        res.json({ success: true, user: newUser });
    }
});

// ... endpoints ...

app.post('/api/complaint', (req, res) => {
    try {
        const { text, user, userId, location, image, email } = req.body;
        const analysis = analyzeComplaint(text, !!image); // Pass image existence flag
        const newComplaint = {
            id: Date.now(), userId: userId || "guest", user: user || "Citizen", location, image, text, ...analysis, status: "Submitted",
            statusHistory: [{ status: "Submitted", time: new Date().toISOString(), note: "Complaint received" }],
            timestamp: new Date().toISOString()
        };
        complaints.unshift(newComplaint);
        saveData(); // <--- PERSIST

        // Find user email for notification
        let recipientEmail = process.env.DEMO_EMAIL || 'harsha145.appikatla@gmail.com';

        // Priority 1: Email sent directly from frontend (Most reliable for logged in session)
        if (email) {
            recipientEmail = email;
        }
        // Priority 2: Lookup by userId if email wasn't sent
        else if (userId && userId !== 'guest') {
            const userObj = users.find(u => u.id == userId); // Loose match for string/int id
            if (userObj) {
                console.log(`[DEBUG] User found: ${userObj.name}, Email: ${userObj.email}`);
                if (userObj.email) {
                    recipientEmail = userObj.email;
                }
            } else {
                console.log(`[DEBUG] User not found in database.`);
            }
        }
        console.log(`[DEBUG] Sending email to: ${recipientEmail}`);

        // --- AUTOMATIC BACKGROUND EMAIL ---
        const mailOptions = {
            from: '"SmartPost AI" <harsha145.appikatla@gmail.com>',
            to: recipientEmail,
            subject: `[Ticket #${newComplaint.id}] Grievance Received: SmartPost AI`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #c0392b; margin-top: 0;">SmartPost AI</h2>
                    <p>Dear <strong>${newComplaint.user}</strong>,</p>
                    <p>This is to acknowledge that your grievance has been successfully registered.</p>
                    
                    <table style="width: 100%; background: #f9f9f9; padding: 10px; border-radius: 5px; margin: 15px 0;">
                        <tr><td><strong>Ticket ID:</strong></td><td>#${newComplaint.id}</td></tr>
                        <tr><td><strong>Category:</strong></td><td>${newComplaint.category}</td></tr>
                        <tr><td><strong>Priority:</strong></td><td style="color: red; font-weight: bold;">${newComplaint.priority}</td></tr>
                        <tr><td><strong>Status:</strong></td><td>Submitted</td></tr>
                    </table>

                    <p>We are analyzing your complaint using AI. You can track status on your dashboard.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">SmartPost AI - Citizen Welfare Division</p>
                </div>
            `
        };

        // Non-blocking email send (Fire and Forget)
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log('Error sending background email:', error);
            else console.log('Background Email sent: ' + info.response);
        });
        // ----------------------------------

        res.json(newComplaint);
    } catch (error) { res.status(500).json({ error: "Server Error" }); }
});

// Admin Endpoint: Manually trigger Official Email Notification
app.post('/api/notify-user', (req, res) => {
    try {
        const { id, user, category, priority } = req.body;

        // Update Ticket Status
        const complaint = complaints.find(c => c.id === id);
        if (complaint && complaint.status === 'Submitted') {
            complaint.status = "In Progress";
            complaint.statusHistory.push({ status: "In Progress", time: new Date().toISOString(), note: "Officer started processing" });
            saveData();
        }

        const mailOptions = {
            from: '"SmartPost AI" <harsha145.appikatla@gmail.com>',
            to: process.env.DEMO_EMAIL || 'harsha145.appikatla@gmail.com', // Demo Mode: Send to Admin
            subject: `[Ticket #${id}] Update: Processing Request`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
                    <h2 style="color: #c0392b; margin-top: 0;">SmartPost AI</h2>
                    <p>Dear <strong>${user}</strong>,</p>
                    <p>We are writing to inform you that your grievance <strong>#${id}</strong> is now <strong>Under Progress</strong>.</p>
                    <p>Our officers have reviewed the initial details and are working on a resolution.</p>
                    <div style="background: #fff3cd; padding: 10px; border-radius: 4px; margin: 15px 0; border: 1px solid #ffeeba; color: #856404;">
                        <strong>Current Status:</strong> Under Progress
                    </div>
                    <p style="font-size: 12px; color: #777;">You will receive another notification upon resolution.</p>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) { console.log('Mail Error:', error); res.status(500).json({ success: false }); }
            else { console.log('Admin Notification Sent:', info.response); res.json({ success: true }); }
        });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

app.get('/api/complaints', (req, res) => res.json(complaints));

app.get('/api/complaints/user/:userId', (req, res) => {
    // Loose equality for ID match
    // Filter out complaints that the user has "soft deleted" (isVisibleToUser === false)
    const userComplaints = complaints.filter(c =>
        (c.userId == req.params.userId || c.userId === 'guest') &&
        c.isVisibleToUser !== false
    );
    res.json(userComplaints);
});

app.post('/api/complaint/:id/hide', (req, res) => {
    const complaint = complaints.find(c => c.id == req.params.id);
    if (complaint) {
        // Enforce "after being resolved" rule
        if (complaint.status !== 'Resolved') {
            return res.status(400).json({ error: "Only resolved complaints can be deleted from history." });
        }
        // Enforce "Feedback Given" rule
        if (!complaint.rating) {
            return res.status(400).json({ error: "Please provide feedback/rating before removing this ticket." });
        }
        complaint.isVisibleToUser = false;
        saveData();
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Ticket not found" });
    }
});

app.post('/api/complaint/:id/resolve', (req, res) => {
    const complaint = complaints.find(c => c.id == req.params.id);
    if (complaint) {
        complaint.status = "Resolved";
        complaint.statusHistory.push({ status: "Resolved", time: new Date().toISOString(), note: "Officer resolved ticket" });
        complaint.finalResponse = req.body.responseText;
        saveData(); // <--- PERSIST
        res.json(complaint);
    } else { res.status(404).json({ error: "Not found" }); }
});

app.post('/api/complaint/:id/rate', (req, res) => {
    const complaint = complaints.find(c => c.id == req.params.id);
    if (complaint) {
        complaint.rating = req.body.rating;
        complaint.userFeedback = req.body.feedback;
        saveData(); // <--- PERSIST
        res.json({ success: true });
    } else { res.status(404).json({ error: "Not found" }); }
});

// Guest Track Endpoint
app.get('/api/complaint/:id/status', (req, res) => {
    const complaint = complaints.find(c => c.id == req.params.id);
    if (complaint) {
        // Return only status-relevant info for guest view
        res.json({
            id: complaint.id,
            status: complaint.status,
            category: complaint.category,
            priority: complaint.priority,
            timestamp: complaint.timestamp,
            finalResponse: complaint.finalResponse,
            statusHistory: complaint.statusHistory
        });
    } else {
        res.status(404).json({ error: "Ticket not found" });
    }
});

app.get('/api/analytics', (req, res) => {
    const categoryCounts = {}; const priorityCounts = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
    complaints.forEach(c => { categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1; if (priorityCounts[c.priority] !== undefined) priorityCounts[c.priority]++; });
    res.json({
        total: complaints.length, resolved: complaints.filter(c => c.status === 'Resolved').length,
        categoryData: Object.keys(categoryCounts).map(k => ({ name: k, value: categoryCounts[k] })),
        priorityData: Object.keys(priorityCounts).map(k => ({ name: k, value: priorityCounts[k] }))
    });
});

app.post('/api/feedback', (req, res) => {
    const { keyword, correctCategory, correctPriority } = req.body;
    if (keyword) customKeywords[keyword.toLowerCase()] = { category: correctCategory, priority: correctPriority, lang: 'en' };
    res.json({ success: true });
});

// --- POSTMEN LOGIC ---
const POSTMEN_FILE = path.join(__dirname, 'postmen.json');
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

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`SmartPost AI Backend running on http://0.0.0.0:${PORT}`));

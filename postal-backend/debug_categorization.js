const Sentiment = require('sentiment');
const sentimentAnalyzer = new Sentiment();

let customKeywords = {
    // --- LOST PACKAGE (High Priority) ---
    'lost': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'missing': { category: 'Lost Package', priority: 'High', lang: 'en' },
    'not received': { category: 'Lost Package', priority: 'High', lang: 'en' },
    // ... [Copying a subset of relevant keywords to debug] ...
    'damaged': { category: 'Damaged Item', priority: 'High', lang: 'en' },
    'damage': { category: 'Damaged Item', priority: 'Medium', lang: 'en' },

    // Some "Others" keywords that might interfere?
    'complaint': { category: 'Others', priority: 'Low', lang: 'en' },
    'help': { category: 'Others', priority: 'Low', lang: 'en' },
    'matter': { category: 'Others', priority: 'Low', lang: 'en' }, // Hypothetical
};

// FULL LIST FROM SERVER (Simulation)
// I will just use the logic to test "damaged" against potential conflicts.

const analyzeComplaint = (text) => {
    const lowerText = text.toLowerCase();
    let category = "Others";
    let priority = "Low";
    let detectedKeyword = null;

    // IMPROVED LOGIC: Sort by length (Longest first) -> Match Whole Words Only
    const sortedKeywords = Object.entries(customKeywords).sort((a, b) => b[0].length - a[0].length);

    for (const [key, value] of sortedKeywords) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Regex: (Start or Separator) + Key + (End or Separator)
        const regex = new RegExp(`(?:^|[\\s\\.,!\\?\\-"'])${escapedKey}(?:$|[\\s\\.,!\\?\\-"'])`, 'i');

        if (regex.test(lowerText)) {
            console.log(`Matched: "${key}" -> ${value.category}`);
            category = value.category;
            priority = value.priority;
            detectedKeyword = key;
            break;
        }
    }
    return { category, detectedKeyword };
};

const text = "damaged product i recieved";
console.log(`Analyzing: "${text}"`);
const result = analyzeComplaint(text);
console.log("Result:", result);

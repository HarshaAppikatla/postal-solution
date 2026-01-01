# 📮 SmartPost AI

### AI-Driven Postal Grievance Analysis & Prioritization System

SmartPost AI is an intelligent grievance management system designed to help large-scale postal services like **India Post** automatically analyze, categorize, and prioritize customer complaints using NLP-based techniques.

The system reduces manual effort, improves response time, and ensures critical issues are addressed first.

---

## 🚩 Problem Statement

Postal departments receive thousands of complaints every day related to:

* Delivery delays
* Lost or damaged parcels
* Staff-related issues
* Urgent or sensitive cases

Manual classification and response handling causes:

* Delays in resolution
* Poor prioritization
* Operational inefficiencies

---

## 🎯 Objective

Build an AI-powered system that:

* Automatically analyzes complaint text
* Classifies complaints into predefined categories
* Detects urgency and sentiment
* Suggests appropriate automated responses
* Helps administrators prioritize critical cases

---

## 💡 Solution Overview

**SmartPost AI** acts as a smart middleware between citizens and postal authorities.
It processes complaint text using rule-based NLP and sentiment analysis to generate structured, actionable insights.

---

## ⚙️ Core Features

### 🔍 Intelligent Complaint Classification

* Categorizes complaints into:
  * Lost Parcel
  * Delivery Delay
  * Damaged Item
  * Staff Behavior
* Uses weighted keyword matching and contextual rules.

### ⚡ Sentiment & Priority Detection

* Sentiment scoring using AFINN-based logic.
* Automatically marks complaints as **CRITICAL** when negative sentiment combines with urgent keywords (e.g., *medicine*, *passport*, *emergency*).

### 🤖 Automated Response Assistance

* Generates category-based, empathetic response templates.
* Helps reduce manual drafting effort for officers.

### 🧠 Feedback Learning (Prototype)

* Admins can correct misclassified complaints.
* System stores corrections to improve future keyword matching logic.

---

## 🌐 Application Modules

### 👤 Citizen Portal

* Text-based complaint submission
* Multilingual-friendly input support
* Image upload for damaged parcels
* Complaint tracking interface
* Timeline-style visualization

### 🛡️ Admin Dashboard

* Complaint analytics and category distribution
* Smart priority queue (urgency-based sorting)
* SLA breach indicators
* Auto-response suggestions
* Postman/task assignment (prototype logic)

---

## 🛠️ Technology Stack

### Frontend

* React 19
* Vite
* Tailwind CSS
* Lucide React

### Backend

* Node.js
* Express.js

### AI / NLP

* Sentiment.js (AFINN-165)
* Custom weighted keyword matching
* Rule-based NLP pipeline

### Data Layer

* JSON-based local persistence (prototype)

---

## 📁 Project Structure

```
postal-solution/
├── postal-backend/
│   ├── server.js
│   ├── server_v2.js
│   ├── data.json
│   ├── learned_keywords.json
│   └── test scripts
│
├── postal-frontend/
│   ├── dist/
│   ├── assets/
│   └── index.html
│
├── screenshots/
└── README.md
```

---

## 🚀 Running the Project Locally

### 1️⃣ Clone the repository

```bash
git clone https://github.com/HarshaAppikatla/postal-solution.git
cd postal-solution
```

### 2️⃣ Start Backend

```bash
cd postal-backend
npm install
node server.js
```

Backend runs on **[http://localhost:5000](http://localhost:5000)**

### 3️⃣ Start Frontend

```bash
cd postal-frontend
npm install
npm run dev
```

Frontend runs on **[http://localhost:5173](http://localhost:5173)**

---

## 🌍 Live Demo

Frontend deployed on **GitHub Pages**
👉 [View Live Application](https://HarshaAppikatla.github.io/postal-solution)

> ⚠️ Backend APIs run locally for hackathon purposes.
> Some features operate in **simulation mode** when backend is not connected.

---

## 🧪 Use Cases

* Postal grievance redressal systems
* Government service automation
* Complaint triage platforms
* Hackathon / academic demonstrations
* Workflow prioritization systems

---

## 🔮 Future Enhancements

* MongoDB / PostgreSQL integration
* JWT-based authentication & roles
* Multilingual NLP models
* ML-based classification (TF-IDF / BERT)
* Email & SMS notifications
* Admin analytics dashboard
* Cloud deployment (Render / AWS / Vercel)

---

## 🏁 Hackathon Context

Developed for **POSTA-THON 2025**, focused on building intelligent, scalable grievance-redressal systems for public services.

---

## 👨‍💻 Author

**Harsha Vardhan Appikatla**
Software Developer | Full-Stack & Backend Enthusiast

🔗 GitHub: [https://github.com/HarshaAppikatla](https://github.com/HarshaAppikatla)

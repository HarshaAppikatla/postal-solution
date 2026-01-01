# SmartPost AI 📮
### *Revolutionizing India Post with AI-Driven Grievance Redressal*

![SmartPost AI Banner](https://img.shields.io/badge/Hackathon-2025-blue?style=for-the-badge&logo=github) ![Status](https://img.shields.io/badge/Status-Deployed-success?style=for-the-badge) ![Tech](https://img.shields.io/badge/Stack-MERN%20%2B%20NLP-orange?style=for-the-badge)

---

## 🚩 The Challenge

### **Context**
The **Indian Postal Service (India Post)** aims to be the preferred provider of postal, financial, and retail services to all citizens of India by providing high-quality, reliable, and affordable services. However, scale brings challenges.

### **Problem Statement**
> **"AI-Based Complaint Analysis and Automated Response System"**

The Indian Postal Department receives thousands of customer complaints daily. Manually categorizing, prioritizing, and responding to them causes significant delays, reduces customer satisfaction, and leads to operational bottlenecks.

### **The Goal**
Develop an AI-based system that:
*   Analyzes incoming complaints automatically.
*   Classifies them into categories (e.g., Delivery Delay, Lost Package).
*   Suggests automated, empathetic responses.
*   Prioritizes critical issues for immediate action.

---

## 💡 Our Solution: SmartPost AI

**SmartPost AI** is a comprehensive response to this problem statement. We have built an intelligent platform that sits between the extensive postal network and the citizen, ensuring that no grievance goes unheard.

### **How We Solved It**

| Problem Requirement | Our Implementation |
| :--- | :--- |
| **NLP for Text Classification** | Implemented a **custom Neural Pattern Matcher** that detects context (e.g., "stolen", "late", "broke") to auto-categorize tickets into *Lost*, *Damaged*, *Delay*, or *Staff Behavior*. |
| **Sentiment Analysis** | Integrated a Sentiment Engine that scores every complaint. Negative sentiment + specific keywords (e.g., "Urgent", "Medicine") automatically escalates priority to **CRITICAL**. |
| **Automated Prioritization** | The Admin Dashboard features a **Smart Queue** that sorts tickets by urgency, not just arrival time. A lost passport gets attention before a general inquiry. |
| **Feedback Learning** | Admins can correct AI categorization. The system "learns" from these corrections (Mock implementation) to improve future accuracy. |

---

## 🚀 Key Application Features

### 🌟 For Citizens (User Portal)
*   **Voice & Text Complaint Filing:** Multilingual support allows users to type or speak in English, Hindi, Telugu, or Tamil.
*   **AI-Powered Form:** The system auto-fills categories based on the user's description.
*   **Visual Evidence:** Users can upload photos of damaged goods directly.
*   **Real-time Tracking:** End-to-end visualization of package journey.

### 🛡️ For Officers (Admin Dashboard)
*   **AI Analytics Dashboard:** Heatmaps of problem areas and breakdown of complaints by category.
*   **SLA Watch:** Visual indicators for tickets breaching response time limits.
*   **Auto-Response Assistant:** One-click generation of empathetic responses in the user's native language.
*   **Postman Assignment:** Assign tasks to specific postmen based on the beat/location.

---

## 🛠️ Technology Stack

*   **Frontend:** React 19, Vite, Tailwind CSS, Lucide React (UI/UX).
*   **Backend:** Node.js, Express.js.
*   **AI/NLP Logic:** Sentiment.js (AFINN-165 vocabulary), Weighted Keyword Matching Algorithm.
*   **Persistence:** Local JSON Storage (Prototyping Data Layer).

---

## 🌍 Live Demo
The application frontend is deployed on GitHub Pages:
**👉 [View Live Application](https://HarshaAppikatla.github.io/postal-solution)**
*(Note: As the backend is hosted locally for this Hackathon demo, features requiring server login (like saving new complaints) will run in "Simulation Mode" or require the local server.)*

---

## 📥 Installation & Local Setup

To run the full system (Frontend + Backend) on your machine:

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/HarshaAppikatla/postal-solution.git
    cd postal-solution
    ```

2.  **Start the Backend (Server)**
    ```bash
    cd postal-backend
    npm install
    node server.js
    ```
    *Server runs on port 5000.*

3.  **Start the Frontend (UI)**
    ```bash
    cd postal-frontend
    npm install
    npm run dev
    ```
    *Frontend runs on port 5173.*

---

## 📸 Screenshots

*(You can add screenshots of your Dashboard here)*

---
**Developed for Smart India Hackathon 2025**
*Solving Public Grievances with Intelligence.*

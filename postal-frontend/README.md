# SmartPost AI / Postal Solution 📮

**SmartPost AI** is a next-generation postal management platform designed to modernize grievance handling, package tracking, and administrative workflows for India Post. It leverages AI to categorize complaints, providing actionable insights and automated responses, while offering a premium, user-friendly interface for citizens and officers.

## 🚀 Key Features

### 🌟 For Citizens (User Portal)
*   **AI-Powered Complaint Filing:** Multilingual support (English, Hindi, Telugu, Tamil, etc.). Users can speak or type their grievances, and our AI automatically detects the language and categorizes the issue.
*   **Real-time Package Tracking:** Track consignments with a beautiful visual timeline and map-based updates.
*   **Smart Profile:** Manage your address, preferred language, and view nearby post offices and assigned postmen.
*   **Photo Evidence:** Upload images of damaged parcels directly within the complaint form.

### 🛡️ For Officers (Admin Dashboard)
*   **Intelligent Triage:** Complaints are auto-categorized (e.g., "Lost Package," "Staff Behavior") using Natural Language Processing (NLP).
*   **Priority Queue:** Critical issues (e.g., mail theft, harassment) are flagged immediately for urgent attention. 
*   **SLA Tracking:** Visual indicators for tickets nearing or breaching Service Level Agreements (SLA).
*   **Response Assistant:** AI suggests empathetic and context-aware responses in the user's local language.
*   **Analytics & Reports:** Generate PDF reports with heatmaps of problem areas, sentiment analysis, and operational trends.

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts (for analytics).
*   **Backend:** Node.js, Express.js.
*   **AI/NLP:** Sentiment.js for emotion analysis, Keyword-based neural pattern matching.
*   **Persistence:** JSON-based local database (for portability/hackathon demo).

## 🌍 Live Demo
The application is deployed on GitHub Pages:
**[View Live Demo](https://HarshaAppikatla.github.io/postal-solution)**
*(Note: As the backend is currently local, some features like login and data saving will only work when running the server locally.)*

## 📥 Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/HarshaAppikatla/postal-solution.git
    cd postal-solution
    ```

2.  **Setup the Backend** (Terminal 1)
    ```bash
    cd postal-backend
    npm install
    node server.js
    ```
    *Server runs on port 5000.*

3.  **Setup the Frontend** (Terminal 2)
    ```bash
    cd postal-frontend
    npm install
    npm run dev
    ```
    *Frontend runs on port 5173.*

## 📸 Screenshots

*(Add screenshots here of the Dashboard, Tracking Page, and Profile)*

## 🤝 Contributing
Contributions are welcome! Please fork this repository and submit a pull request.

---
**Made with ❤️ for modernizing India's communications.**

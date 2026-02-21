# 📊 AuditAI - Enterprise Analytics Dashboard

AuditAI is an AI-powered, role-based analytics dashboard designed for enterprise data teams. It allows users to securely query customer feedback, visualize Net Promoter Score (NPS) trends, and generate AI-driven summaries of user reviews using Google's Gemini AI. 

The system implements strict Role-Based Access Control (RBAC) to ensure employees can only access data within their assigned domains and categories, backed by a comprehensive security audit logger.

## 🚀 Live Demo

* **Frontend (Vercel):** [https://audit-ai-kappa-seven.vercel.app](https://audit-ai-kappa-seven.vercel.app)
* **Backend (Render):** `https://auditai-s06q.onrender.com`

### Demo Accounts
You can use the following credentials to test the RBAC features:
* **Admin Account:** `admin` / `admin123` *(Has full access and can manage users)*
* **Analyst Account:** `analyst` / `analyst123` *(Restricted access to specific categories)*

---

## ✨ Key Features

* **🤖 AI-Powered Chat Workspace:** Users can ask plain-text questions (e.g., *"Summarize negative reviews for mobile"*, *"Show NPS chart for support"*). The system classifies the intent and generates either a Recharts visualization or a Gemini AI summary.
* **🔐 Strict Role-Based Access Control (RBAC):** Users are restricted by `role`, `assignedDomains`, and `assignedCategories`. Unauthorized queries are blocked at the middleware level.
* **🛡️ Security Audit Logging:** Every action, AI query, and unauthorized access attempt is logged permanently to the database for security compliance.
* **⚡ Intelligent Caching:** AI responses and MongoDB aggregation pipelines are cached. Repeated queries are served instantly, saving AI credits and database compute.
* **👨‍💻 Admin Command Center:** Admins can view security logs in real-time and dynamically update user access permissions.
* **🍪 Enterprise Security:** Implements HTTP-only strict cookies, Express rate-limiting, and reverse-proxy trust for robust production security.

---

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* Tailwind CSS (Styling)
* Lucide React (Icons)
* Recharts (Data Visualization)
* Axios (API Client)
* React Router DOM (Routing)

**Backend:**
* Node.js & Express.js
* MongoDB & Mongoose (Database & Aggregation Pipelines)
* `@google/genai` (Gemini AI LLM Integration)
* JSON Web Tokens (JWT) & bcryptjs (Authentication)
* `express-rate-limit` (DDoS Protection)

---

## 💻 Local Setup Instructions

### Prerequisites
* Node.js (v18+)
* MongoDB instance (Local or Atlas)
* Google Gemini API Key

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/AuditAI.git](https://github.com/yourusername/AuditAI.git)
cd AuditAI

```

### 2. Backend Setup

```bash
cd backend
npm install

```

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

```

Run the backend server:

```bash
npm run dev

```

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install

```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3000/api

```

Run the frontend development server:

```bash
npm run dev

```

---

## 📁 Repository Structure

```text
AuditAI/
├── backend/                  # Express/Node.js Server
│   ├── src/
│   │   ├── config/           # DB connection
│   │   ├── controllers/      # Route logic (Auth, Chat, Admin, Reports)
│   │   ├── middlewares/      # JWT verification & RBAC enforcement
│   │   ├── models/           # Mongoose schemas (User, Review, ChatHistory, AuditLog)
│   │   ├── routes/           # Express routers
│   │   ├── services/         # LLM service, Aggregation, Caching
│   │   └── utils/            # Intent classification logic
│   └── server.js             # Entry point
├── frontend/                 # React/Vite Application
│   ├── src/
│   │   ├── components/       # Reusable UI (Auth guards, Icons)
│   │   ├── context/          # AuthContext for global state
│   │   ├── layouts/          # Dashboard wrapper
│   │   ├── pages/            # Views (Login, Workspace, Admin, Reports)
│   │   └── services/         # Axios API configuration
│   └── vercel.json           # SPA routing config for deployment
└── docs/                     # Assignment Deliverables (Report & Presentation)

```

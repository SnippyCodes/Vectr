# Vectr

**The Ultimate Open Source Contribution Assistant & Manager.**

Vectr is a full-stack platform designed to make jumping into open-source projects seamless, intuitive, and highly guided. By combining an intuitive dashboard, automated repository analysis, and an AI-powered coding assistant natively mapped to GitHub, Vectr helps developers of all experience levels find the right issues, understand large codebases lightning fast, and confidently push commits.

---

## 🌟 Key Features

### 1. Unified Dashboard
- Visualizes your complete GitHub contribution map (heat map) natively in the app.
- Tracks all the issues you are currently working on in real-time.
- Monitors the status of the pull requests you generated.

### 2. Intelligent Issue Selection Flows
- Discover organizations, repositories, and open issues tailored to your tech stack and experience level.
- Sorts and tags beginner-friendly / "good first issue" candidates automatically for newer developers.

### 3. AI-Powered "Nova" Assistant
- **Automated Repo Analysis:** Vectr scans the entire repository architecture and README, compiling a deep structural understanding of the project before you even begin.
- **Context-Aware Assistance:** Chat directly with Nova (our AWS Bedrock LLM wrapper) while working on an issue. Nova instantly grasps the current repository layout, the nuances of the issue you chose, and any local code changes you've made.
- **Commit Tailing:** Nova tracks your local Git branch changes and can cross-evaluate your diffs against the issue requirements.

---

## 🚀 Tech Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL
- **AI Integration:** AWS Bedrock (Amazon Nova), Ollama (Local mocking and fallback)
- **External APIs:** GitHub REST API, GitHub GraphQL API

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.10+)
- PostgreSQL installed and running
- **AWS Credentials:** To use the Nova AI, you must have an AWS account with Bedrock enabled for the `amazon.nova-lite-v1:0` model.
- **GitHub PAT:** A Personal Access Token is necessary to query GitHub limits and generate accurate commit maps.

### 1. Clone the repository
```bash
git clone https://github.com/SnippyCodes/Vectr.git
cd Vectr
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Activate the virtual environment
# On Windows:
.\.venv\Scripts\Activate.ps1
# On MacOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Edit the .env with your PostgreSQL credentials, GitHub PAT, and AWS credentials.

# Run the backend server
uvicorn app.main:app --reload
```

### 3. Frontend Setup
Open a new terminal session.
```bash
cd frontend/vectr-app
npm install

# Run the Vite development server
npm run dev
```

Your frontend should now be running on `http://localhost:5173` while your backend serves the APIs at `http://localhost:8000`.

---

## 🔒 Security

We ensure NO sensitive data like `.env` files, virtual environments, caches, or personal test logs are pushed to the main branch. 

All PATs stored in the database are encrypted using symmetric fernet encryption before storage, and decrypted safely solely in-memory when fetching live GitHub Data.

---

## 👩‍💻 Contributing
Feel free to open an issue or submit a pull request if you want to improve Vectr!

Developed by the Vectr Team.

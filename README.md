🌺 Hibiscus
AI-Powered Universal Study Workspace

Hibiscus is a full-stack AI learning platform designed to transform passive studying into active understanding.

Students can upload PDFs, paste text, or submit web URLs, highlight content directly inside the platform, and instantly convert those highlights into AI-generated summaries, flashcards, and exam-ready notes — all within a single, organized workspace.

Unlike traditional note-taking or summarization tools, Hibiscus actively evaluates how well a student understands the material and adapts the learning process accordingly.


🏗 Tech Stack
🎨 Frontend

React.js – Component-based UI development

Tailwind CSS – Utility-first styling for fast and responsive design

PDF.js – In-browser PDF rendering and text highlighting

Vite – Fast development server and build tool

⚙️ Backend

Node.js – Server-side JavaScript runtime

Express.js – REST API framework

SQLite (better-sqlite3) – Lightweight database for fast local and server-side storage
(used for rapid development and deployment on Render)

🤖 AI Integration

Google AI Studio (Gemini API) –

Flashcard generation

Summarization

Active recall evaluation

Debate and critical thinking prompts

Simplification of complex content

🔐 Authentication & Security

JWT (JSON Web Tokens) – Secure session handling

bcrypt – Password hashing and encryption

Environment Variables – Secure API key management

☁️ Deployment

Render – Hosting for backend and full-stack application

GitHub – Version control and CI-based deployments

🛠 Developer Tools

VS Code – Development environment

npm – Package management

Git – Source control

Features

Universal Study Workspace
Upload PDFs, paste text, or submit web URLs. Study everything in one place with an integrated reader and highlighter.

AI-Powered Study Material Generation
Instantly convert highlights into summaries, flashcards, exam-ready answers, and quick revision sheets using AI.

Active Recall Evaluation (Explain-It-Back)
Explain concepts in your own words and receive an AI-generated understanding score, missing key points, and improvement feedback.

Confusion Detection & Simplification
Detects confusion based on reading behavior and offers simplified explanations when users struggle with a section.

AI Debate Mode
Builds critical thinking by generating counter-arguments and challenges to test deep conceptual understanding.

Focus & Procrastination Monitoring
Tracks inactivity and tab switching, triggers focus reminders, and maintains study streaks.

Installation commands

npm install
This installs all required backend and frontend packages.
Configure Environment Variables

 Build the Frontend
npm run build
This generates the production-ready frontend in the dist/ folder.

Start the Application
npm start
The app will be available at:
http://localhost:3000
Development Mode
npm run dev
Runs the app with hot-reloading for development.


Run commands

Run in Development Mode
npm run dev                                                                                                                                                       Run in Production Mode (Local)
npm run build
npm start

SCREENSHOTS

![WhatsApp Image 2026-02-28 at 08 09 06](https://github.com/user-attachments/assets/9146e97a-5999-44fa-a43f-8357a14a6283)
![WhatsApp Image 2026-02-28 at 08 09 06 (1)](https://github.com/user-attachments/assets/47e45e03-dd1e-48ff-ad36-b1ef211f4aff)
![WhatsApp Image 2026-02-28 at 08 09 06 (2)](https://github.com/user-attachments/assets/a0a9621e-206c-48e6-927f-310d50cdd6a2)
![WhatsApp Image 2026-02-28 at 08 09 07](https://github.com/user-attachments/assets/715e6e3c-96db-4229-ad30-9738dd3f5423)
![WhatsApp Image 2026-02-28 at 08 09 07 (1)](https://github.com/user-attachments/assets/4e22fe6c-8519-4c9e-9b4e-22d4535fd7df)
![WhatsApp Image 2026-02-28 at 08 09 07 (2)](https://github.com/user-attachments/assets/f7c3223c-6aa2-46c7-b1c2-23b03d20779b)
![WhatsApp Image 2026-02-28 at 08 09 07 (3)](https://github.com/user-attachments/assets/ee6052b2-464d-4e9f-bbd8-8076ca373896)
![WhatsApp Image 2026-02-28 at 08 09 07 (4)](https://github.com/user-attachments/assets/dc9f6002-966d-496e-a69b-32116851917c)
![WhatsApp Image 2026-02-28 at 08 09 07 (5)](https://github.com/user-attachments/assets/f9b13d49-840b-49d8-b1fb-7bf4c47e7451)
![WhatsApp Image 2026-02-28 at 08 14 00](https://github.com/user-attachments/assets/de349f1d-cbe3-45f7-bebe-5ead2027646b)


DEMO VIDEO LINK
https://drive.google.com/file/d/1euOZ_NDXJMlxATxchr6cK2r01Kjq1qm7/view?usp=sharing


API Documentation

Hibiscus provides a RESTful backend API built with Express.js and SQLite.
These APIs power lesson management, document storage, highlighting, study tracking, and content extraction.

All endpoints are prefixed with:

/api
📂 Lessons API
GET /api/lessons

Fetch all study lessons (workspaces).

Response

[
  {
    "id": "lesson-id",
    "title": "Operating Systems",
    "description": "CPU scheduling concepts",
    "created_at": "2026-02-27 10:12:34"
  }
]
POST /api/lessons

Create a new lesson.

Request Body

{
  "title": "Computer Networks",
  "description": "OSI model and protocols"
}

Response

{
  "id": "generated-lesson-id"
}
DELETE /api/lessons/:id

Delete a lesson and all associated documents, highlights, flashcards, and study sessions.

📄 Documents API
GET /api/lessons/:id/documents

Fetch all documents under a specific lesson.

POST /api/documents

Add a document to a lesson.

Request Body

{
  "id": "document-id",
  "lesson_id": "lesson-id",
  "title": "CPU Scheduling Notes",
  "content": "Raw text or extracted content",
  "type": "pdf"
}
GET /api/documents

Fetch all documents across all lessons.

GET /api/documents/:id

Fetch a single document along with its highlights.

Response

{
  "id": "document-id",
  "title": "CPU Scheduling",
  "content": "...",
  "type": "text",
  "highlights": [
    {
      "id": "highlight-id",
      "text": "A process is a program in execution",
      "color": "#facc15",
      "tags": "definition"
    }
  ]
}
DELETE /api/documents/:id

Delete a document and all related highlights, flashcards, and study sessions.

✏ Highlights API
POST /api/highlights

Save a highlighted section from a document.

Request Body

{
  "id": "highlight-id",
  "document_id": "document-id",
  "text": "Important highlighted content",
  "color": "#fde047",
  "tags": "important,exam"
}
GET /api/lessons/:id/highlights

Fetch all highlights belonging to a lesson.

🧠 Study Sessions & Analytics
POST /api/sessions

Store a study session record.

Request Body

{
  "id": "session-id",
  "document_id": "document-id",
  "duration": 420,
  "confusion_alerts": 1,
  "recall_score": 82
}
GET /api/stats

Fetch aggregated study statistics.

Response

{
  "totalDocs": 5,
  "totalHighlights": 41,
  "avgRecall": 78,
  "totalTime": 2400,
  "totalDistractions": 3
}
🌐 Web Content Extraction
POST /api/fetch-url

Extract readable content from a web URL.

Request Body

{
  "url": "https://example.com/article"
}

Response

{
  "title": "Article Title",
  "content": "Cleaned and structured article text"
}
🔐 Authentication (Demo-Level)
POST /api/auth/login

Simple login / auto-register endpoint.

Request Body

{
  "email": "student@example.com",
  "name": "Student Name"
}
GET /api/auth/me

TEAM MEMBERS
1.CATHERINE MARIA BASTIN
2.NEEHARA ANNA BINCE






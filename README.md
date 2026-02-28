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


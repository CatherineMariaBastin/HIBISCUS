import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hibiscus.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    lesson_id TEXT,
    title TEXT,
    content TEXT,
    type TEXT, -- 'pdf', 'text', 'url'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(lesson_id) REFERENCES lessons(id)
  );

  CREATE TABLE IF NOT EXISTS highlights (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    text TEXT,
    color TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  );

  CREATE TABLE IF NOT EXISTS flashcards (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    question TEXT,
    answer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  );

  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    duration INTEGER,
    confusion_alerts INTEGER DEFAULT 0,
    recall_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  );
`);

// Migration: Add lesson_id to documents if it doesn't exist
try {
  db.prepare("ALTER TABLE documents ADD COLUMN lesson_id TEXT").run();
  console.log("[Migration] Added lesson_id column to documents table.");
} catch (err: any) {
  if (err.message.includes("duplicate column name")) {
    // Column already exists, ignore
  } else {
    console.error("[Migration] Error adding lesson_id column:", err.message);
  }
}

// Log database state on startup
const lessonCount = db.prepare("SELECT COUNT(*) as count FROM lessons").get().count;
const docCount = db.prepare("SELECT COUNT(*) as count FROM documents").get().count;
console.log(`[Database] Initialized. Lessons: ${lessonCount}, Documents: ${docCount}`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/lessons", (req, res) => {
    const lessons = db.prepare("SELECT * FROM lessons ORDER BY created_at DESC").all();
    res.json(lessons);
  });

  app.delete("/api/lessons/:id", (req, res) => {
    const { id } = req.params;
    // Delete associated documents, highlights, flashcards, and sessions first (cascading delete simulation)
    db.prepare("DELETE FROM highlights WHERE document_id IN (SELECT id FROM documents WHERE lesson_id = ?)").run(id);
    db.prepare("DELETE FROM flashcards WHERE document_id IN (SELECT id FROM documents WHERE lesson_id = ?)").run(id);
    db.prepare("DELETE FROM study_sessions WHERE document_id IN (SELECT id FROM documents WHERE lesson_id = ?)").run(id);
    db.prepare("DELETE FROM documents WHERE lesson_id = ?").run(id);
    db.prepare("DELETE FROM lessons WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/lessons", (req, res) => {
    const { id, title, description } = req.body;
    db.prepare("INSERT INTO lessons (id, title, description) VALUES (?, ?, ?)")
      .run(id, title, description);
    res.json({ success: true });
  });

  app.get("/api/lessons/:id/documents", (req, res) => {
    const docs = db.prepare("SELECT * FROM documents WHERE lesson_id = ? ORDER BY created_at ASC").all(req.params.id);
    res.json(docs);
  });

  app.get("/api/lessons/:id/highlights", (req, res) => {
    const highlights = db.prepare(`
      SELECT h.*, d.title as document_title 
      FROM highlights h 
      JOIN documents d ON h.document_id = d.id 
      WHERE d.lesson_id = ? 
      ORDER BY h.created_at DESC
    `).all(req.params.id);
    res.json(highlights);
  });

  app.get("/api/documents", (req, res) => {
    const docs = db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all();
    res.json(docs);
  });

  app.delete("/api/documents/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM highlights WHERE document_id = ?").run(id);
    db.prepare("DELETE FROM flashcards WHERE document_id = ?").run(id);
    db.prepare("DELETE FROM study_sessions WHERE document_id = ?").run(id);
    db.prepare("DELETE FROM documents WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/documents", (req, res) => {
    const { id, lesson_id, title, content, type } = req.body;
    db.prepare("INSERT INTO documents (id, lesson_id, title, content, type) VALUES (?, ?, ?, ?, ?)")
      .run(id, lesson_id, title, content, type);
    res.json({ success: true });
  });

  app.get("/api/documents/:id", (req, res) => {
    const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(req.params.id);
    const highlights = db.prepare("SELECT * FROM highlights WHERE document_id = ?").all(req.params.id);
    res.json({ ...doc, highlights });
  });

  app.post("/api/highlights", (req, res) => {
    const { id, document_id, text, color, tags } = req.body;
    db.prepare("INSERT INTO highlights (id, document_id, text, color, tags) VALUES (?, ?, ?, ?, ?)")
      .run(id, document_id, text, color, tags);
    res.json({ success: true });
  });

  app.get("/api/stats", (req, res) => {
    const totalDocs = db.prepare("SELECT COUNT(*) as count FROM documents").get().count;
    const totalHighlights = db.prepare("SELECT COUNT(*) as count FROM highlights").get().count;
    const avgRecall = db.prepare("SELECT AVG(recall_score) as avg FROM study_sessions WHERE recall_score IS NOT NULL").get().avg || 0;
    const totalTime = db.prepare("SELECT SUM(duration) as total FROM study_sessions").get().total || 0;
    const totalDistractions = db.prepare("SELECT SUM(confusion_alerts) as total FROM study_sessions").get().total || 0;
    res.json({ totalDocs, totalHighlights, avgRecall, totalTime, totalDistractions });
  });

  app.post("/api/sessions", (req, res) => {
    const { id, document_id, duration, confusion_alerts, recall_score } = req.body;
    db.prepare("INSERT INTO study_sessions (id, document_id, duration, confusion_alerts, recall_score) VALUES (?, ?, ?, ?, ?)")
      .run(id, document_id, duration, confusion_alerts, recall_score);
    res.json({ success: true });
  });

  // Auth Routes (Simple)
  app.post("/api/auth/login", (req, res) => {
    const { email, name } = req.body;
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO users (id, name, email) VALUES (?, ?, ?)")
        .run(id, name || email.split('@')[0], email);
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    }
    res.json(user);
  });

  app.get("/api/auth/me", (req, res) => {
    // In a real app, we'd check a session/token
    // For this demo, we'll return the first user or null
    const user = db.prepare("SELECT * FROM users LIMIT 1").get();
    res.json(user || null);
  });

  app.post("/api/fetch-url", async (req, res) => {
    const { url } = req.body;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      
      // Improved extraction to preserve some structure
      let content = html;
      
      // Remove scripts, styles, and comments
      content = content.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "");
      content = content.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "");
      content = content.replace(/<!--[\s\S]*?-->/g, "");
      
      // Convert headers to markdown
      content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
      content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
      content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
      
      // Convert paragraphs and lists
      content = content.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n");
      content = content.replace(/<li[^>]*>(.*?)<\/li>/gi, "\n* $1");
      
      // Strip remaining tags but keep content
      content = content.replace(/<[^>]*>/g, " ");
      
      // Decode HTML entities
      const entities: { [key: string]: string } = {
        '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"
      };
      content = content.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);
      
      // Clean up whitespace
      content = content.replace(/\n\s+\n/g, "\n\n")
                       .replace(/\n{3,}/g, "\n\n")
                       .trim();

      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : url;
      
      const finalContent = content || "Could not extract meaningful content from this URL. The site might be protected or require JavaScript.";

      res.json({ title, content: finalContent });
    } catch (error: any) {
      console.error("Fetch error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

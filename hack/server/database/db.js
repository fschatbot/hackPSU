import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, "..", "data");
if (!existsSync(dataDir)) {
	mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, "codelens.db");

// Create SQLite database connection
const db = new Database(dbPath, {
	verbose: process.env.NODE_ENV === "development" ? console.log : null,
});

// Enable foreign keys
db.pragma("foreign_keys = ON");

console.log(`✅ Connected to SQLite database at: ${dbPath}`);

// Initialize database schema
const initSchema = () => {
	// Create users table
	db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

	// Create sessions table (optional - for tracking active sessions)
	db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

	// Create projects table (for storing user projects)
	db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      files TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

	// Create indexes for better performance
	db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
  `);

	// Create triggers to update updated_at timestamp
	db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

	db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_projects_updated_at
    AFTER UPDATE ON projects
    FOR EACH ROW
    BEGIN
      UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

	console.log("✅ Database schema initialized");
};

// Initialize schema on startup
initSchema();

// Helper function to run queries
// Helper function to run queries
export const query = (sql, params = []) => {
	try {
		if (sql.trim().toUpperCase().startsWith("SELECT")) {
			const stmt = db.prepare(sql);
			// Remove the spread operator (...)
			return { rows: stmt.all(params) };
		} else if (sql.trim().toUpperCase().startsWith("INSERT") || sql.trim().toUpperCase().startsWith("UPDATE") || sql.trim().toUpperCase().startsWith("DELETE")) {
			const stmt = db.prepare(sql);
			// Remove the spread operator (...)
			const result = stmt.run(params);
			return { rows: [], lastID: result.lastInsertRowid, changes: result.changes };
		} else {
			db.exec(sql);
			return { rows: [] };
		}
	} catch (error) {
		console.error("Database query error:", error);
		throw error;
	}
};

// Transaction helper
export const transaction = (callback) => {
	try {
		db.exec("BEGIN");
		const result = callback(db);
		db.exec("COMMIT");
		return result;
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
};

export default db;

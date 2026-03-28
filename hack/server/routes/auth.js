import express from "express";
import bcrypt from "bcrypt";
import { query } from "../database/db.js";
import { generateToken, authenticateToken } from "../middleware/auth.js";

const router = express.Router();
const SALT_ROUNDS = 10;

// Register new user
router.post("/register", async (req, res) => {
	try {
		const { email, password, name } = req.body;

		// Validate input
		if (!email || !password || !name) {
			return res.status(400).json({ error: "Email, password, and name are required" });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "Password must be at least 6 characters" });
		}

		// Check if user already exists
		// In auth.js, change $1 to ?
		const existingUser = await query("SELECT id FROM users WHERE email = ?", [email]);

		if (existingUser.rows.length > 0) {
			return res.status(409).json({ error: "Email already registered" });
		}

		// Hash password
		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

		// Generate avatar URL
		const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

		// Insert user
		const insertResult = await query("INSERT INTO users (email, password_hash, name, avatar) VALUES (?, ?, ?, ?)", [email, passwordHash, name, avatar]);

		// Get the inserted user
		const result = await query("SELECT id, email, name, avatar, created_at FROM users WHERE id = ?", [insertResult.lastID]);

		const user = result.rows[0];

		// Generate JWT token
		const token = generateToken(user.id, user.email);

		res.status(201).json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				avatar: user.avatar,
				createdAt: user.created_at,
			},
			token,
		});
	} catch (error) {
		console.error("Register error:", error);
		res.status(500).json({ error: "Registration failed" });
	}
});

// Login user
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required" });
		}

		// Find user
		const result = await query("SELECT id, email, password_hash, name, avatar, created_at FROM users WHERE email = ?", [email]);

		if (result.rows.length === 0) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		const user = result.rows[0];

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password_hash);

		if (!isValidPassword) {
			return res.status(401).json({ error: "Invalid email or password" });
		}

		// Generate JWT token
		const token = generateToken(user.id, user.email);

		res.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				avatar: user.avatar,
				createdAt: user.created_at,
			},
			token,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Login failed" });
	}
});

// Get current user (protected route)
router.get("/me", authenticateToken, async (req, res) => {
	try {
		const result = await query("SELECT id, email, name, avatar, created_at FROM users WHERE id = ?", [req.user.userId]);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		res.json({
			success: true,
			user: result.rows[0],
		});
	} catch (error) {
		console.error("Get user error:", error);
		res.status(500).json({ error: "Failed to get user" });
	}
});

// Logout (optional - mainly for clearing server-side sessions if needed)
router.post("/logout", authenticateToken, async (req, res) => {
	try {
		// With JWT, logout is mainly client-side (delete token)
		// But you could maintain a blacklist or sessions table if needed
		res.json({ success: true, message: "Logged out successfully" });
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({ error: "Logout failed" });
	}
});

export default router;

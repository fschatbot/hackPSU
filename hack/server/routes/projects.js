import express from 'express';
import { query } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// List all projects for current user
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, description, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.userId]
    );
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

// Get a single project with files
router.get('/:id', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, description, files, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = result.rows[0];
    project.files = JSON.parse(project.files);
    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Save / create a project
router.post('/', async (req, res) => {
  try {
    const { name, description, files } = req.body;
    if (!name || !files) {
      return res.status(400).json({ error: 'Name and files are required' });
    }

    const filesJson = typeof files === 'string' ? files : JSON.stringify(files);

    const result = await query(
      'INSERT INTO projects (user_id, name, description, files) VALUES (?, ?, ?, ?)',
      [req.user.userId, name, description || '', filesJson]
    );

    res.status(201).json({
      project: {
        id: result.lastID,
        name,
        description: description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to save project' });
  }
});

// Update an existing project
router.put('/:id', async (req, res) => {
  try {
    const { name, description, files } = req.body;

    // Verify ownership
    const existing = await query(
      'SELECT id FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (files !== undefined) {
      updates.push('files = ?');
      params.push(typeof files === 'string' ? files : JSON.stringify(files));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    params.push(req.params.id);
    await query(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;

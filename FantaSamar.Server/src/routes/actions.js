const express = require('express');
const { db, generateId } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function toAction(row) {
  return { ...row, isGlobal: !!row.isGlobal };
}

router.get('/', authenticateToken, (req, res) => {
  const actions = db.prepare('SELECT * FROM actions ORDER BY createdAt ASC').all();
  res.json(actions.map(toAction));
});

router.post('/', authenticateToken, (req, res) => {
  const { name, points, type, scope, isGlobal } = req.body;

  if (!name || points === undefined || !type || !scope) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  }

  const newAction = {
    id: generateId(),
    name,
    points,
    type,
    scope,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    isGlobal: isGlobal === false ? 0 : 1
  };

  db.prepare(`
    INSERT INTO actions (id, name, points, type, scope, createdBy, createdAt, isGlobal)
    VALUES (@id, @name, @points, @type, @scope, @createdBy, @createdAt, @isGlobal)
  `).run(newAction);

  res.status(201).json(toAction(newAction));
});

router.put('/:id', authenticateToken, (req, res) => {
  const existing = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Azione non trovata' });
  }

  const updated = {
    ...existing,
    ...req.body,
    isGlobal: req.body.isGlobal === undefined ? existing.isGlobal : (req.body.isGlobal ? 1 : 0)
  };

  db.prepare(`
    UPDATE actions SET name = @name, points = @points,
      type = @type, scope = @scope, isGlobal = @isGlobal
    WHERE id = @id
  `).run(updated);

  res.json(toAction(updated));
});

router.delete('/:id', authenticateToken, (req, res) => {
  const result = db.prepare('DELETE FROM actions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Azione non trovata' });
  }
  res.json({ success: true });
});

module.exports = router;

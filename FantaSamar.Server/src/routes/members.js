const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const members = db.prepare('SELECT * FROM samar_members ORDER BY id ASC').all();
  const withPoints = members.map(m => {
    const globalPoints = db.prepare('SELECT totalPoints FROM member_global_points WHERE memberId = ?').get(m.id);
    return { ...m, totalPoints: globalPoints ? globalPoints.totalPoints : 0 };
  });
  res.json(withPoints);
});

router.get('/:id', authenticateToken, (req, res) => {
  const member = db.prepare('SELECT * FROM samar_members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Membro non trovato' });
  const globalPoints = db.prepare('SELECT totalPoints FROM member_global_points WHERE memberId = ?').get(member.id);
  res.json({ ...member, totalPoints: globalPoints ? globalPoints.totalPoints : 0 });
});

// Applica punti di un'azione a un membro (punteggio globale, indipendente dalla squadra)
router.post('/:id/points', authenticateToken, (req, res) => {
  const memberId = Number(req.params.id);
  const { actionId, actionName, points } = req.body;
  const member = db.prepare('SELECT * FROM samar_members WHERE id = ?').get(memberId);
  if (!member) return res.status(404).json({ error: 'Membro non trovato' });

  let globalPoints = db.prepare('SELECT * FROM member_global_points WHERE memberId = ?').get(memberId);

  const tx = db.transaction(() => {
    if (!globalPoints) {
      db.prepare('INSERT INTO member_global_points (memberId, totalPoints) VALUES (?, 0)').run(memberId);
    }

    db.prepare('UPDATE member_global_points SET totalPoints = totalPoints + ? WHERE memberId = ?').run(points, memberId);
    db.prepare(`
      INSERT INTO member_action_records (memberId, actionId, actionName, points, appliedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(memberId, actionId, actionName, points, new Date().toISOString());
  });
  tx();

  const updated = db.prepare('SELECT totalPoints FROM member_global_points WHERE memberId = ?').get(memberId);
  res.json({ ...member, totalPoints: updated.totalPoints });
});

module.exports = router;

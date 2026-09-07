const express = require('express');
const { db, generateId } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function loadTeamFull(teamId) {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return null;

  const memberIds = JSON.parse(team.memberIds);
  const memberPoints = memberIds.map(memberId => {
    const globalPoints = db.prepare('SELECT * FROM member_global_points WHERE memberId = ?').get(memberId);
    const actions = db.prepare('SELECT * FROM member_action_records WHERE memberId = ? ORDER BY appliedAt ASC').all(memberId);
    return {
      memberId,
      totalPoints: globalPoints ? globalPoints.totalPoints : 0,
      actions: actions.map(a => ({
        actionId: a.actionId,
        actionName: a.actionName,
        points: a.points,
        appliedAt: a.appliedAt
      }))
    };
  });

  return {
    id: team.id,
    name: team.name,
    userId: team.userId,
    memberIds,
    memberPoints,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt
  };
}

router.get('/', authenticateToken, (req, res) => {
  const teams = db.prepare('SELECT id FROM teams').all();
  res.json(teams.map(t => loadTeamFull(t.id)));
});

router.get('/user/:userId', authenticateToken, (req, res) => {
  const teams = db.prepare('SELECT id FROM teams WHERE userId = ?').all(req.params.userId);
  res.json(teams.map(t => loadTeamFull(t.id)));
});

router.get('/:id', authenticateToken, (req, res) => {
  const team = loadTeamFull(req.params.id);
  if (!team) return res.status(404).json({ error: 'Squadra non trovata' });
  res.json(team);
});

router.post('/', authenticateToken, (req, res) => {
  const { name, memberIds } = req.body;

  if (!name || !Array.isArray(memberIds) || memberIds.length !== 4) {
    return res.status(400).json({ error: 'Una squadra deve avere un nome e esattamente 4 membri' });
  }

  const existingTeamsCount = db.prepare('SELECT COUNT(*) as c FROM teams WHERE userId = ?').get(req.user.id).c;
  if (existingTeamsCount >= 2) {
    return res.status(409).json({ error: 'Hai gi\u00e0 raggiunto il numero massimo di 2 squadre' });
  }

  const now = new Date().toISOString();
  const teamId = generateId();

  const insertTeam = db.prepare(`
    INSERT INTO teams (id, name, userId, memberIds, createdAt, updatedAt)
    VALUES (@id, @name, @userId, @memberIds, @createdAt, @updatedAt)
  `);

  const tx = db.transaction(() => {
    insertTeam.run({
      id: teamId,
      name,
      userId: req.user.id,
      memberIds: JSON.stringify(memberIds),
      createdAt: now,
      updatedAt: now
    });
  });
  tx();

  res.status(201).json(loadTeamFull(teamId));
});

router.delete('/:id', authenticateToken, (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Squadra non trovata' });
  if (team.userId !== req.user.id) return res.status(403).json({ error: 'Non autorizzato' });

  db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Applica punti di un'azione a un membro specifico (punteggio globale, indipendente dalla squadra)
router.post('/:id/points', authenticateToken, (req, res) => {
  const { memberId, actionId, actionName, points } = req.body;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Squadra non trovata' });

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

    db.prepare('UPDATE teams SET updatedAt = ? WHERE id = ?').run(new Date().toISOString(), team.id);
  });
  tx();

  res.json(loadTeamFull(team.id));
});

module.exports = router;

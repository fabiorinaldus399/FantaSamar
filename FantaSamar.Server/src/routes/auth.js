const express = require('express');
const bcrypt = require('bcryptjs');
const { db, generateId } = require('../db');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt
  };
}

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password sono obbligatori' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(409).json({ error: 'Username già registrato' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    id: generateId(),
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO users (id, username, passwordHash, createdAt)
    VALUES (@id, @username, @passwordHash, @createdAt)
  `).run(newUser);

  const token = generateToken(newUser);
  res.status(201).json({ token, user: toPublicUser(newUser) });
});

router.post('/login', (req, res) => {
  const { username, password, rememberDevice } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password sono obbligatori' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  const token = generateToken(user, !!rememberDevice);
  res.json({ token, user: toPublicUser(user) });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Utente non trovato' });
  }
  res.json(toPublicUser(user));
});

module.exports = router;

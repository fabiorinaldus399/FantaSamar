const express = require('express');
const { db } = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Elenco pubblico (solo id/username) di tutti gli utenti registrati, usato per mostrare i nomi proprietari delle squadre
router.get('/', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, username FROM users').all();
  res.json(users);
});

module.exports = router;

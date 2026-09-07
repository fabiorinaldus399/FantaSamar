const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fantasamar-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';
const JWT_EXPIRES_IN_REMEMBER = '30d';

function generateToken(user, rememberDevice = false) {
  const expiresIn = rememberDevice ? JWT_EXPIRES_IN_REMEMBER : JWT_EXPIRES_IN;
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token non valido o scaduto' });
    }
    req.user = payload;
    next();
  });
}

module.exports = { generateToken, authenticateToken, JWT_SECRET };

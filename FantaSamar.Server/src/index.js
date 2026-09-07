const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const actionsRoutes = require('./routes/actions');
const teamsRoutes = require('./routes/teams');
const membersRoutes = require('./routes/members');

initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/members', membersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`FantaSAMAR server in ascolto su http://localhost:${PORT}`);
});

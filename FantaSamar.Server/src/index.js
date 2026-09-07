const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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

// In sviluppo il frontend Angular può essere raggiunto sia da localhost sia da
// un altro dispositivo sulla rete locale (es. https://192.168.1.50:4200).
// Se CORS_ORIGIN è impostata, viene usata quella lista esplicita (consigliato
// in produzione). Altrimenti, in assenza della variabile, si accetta qualsiasi
// origine proveniente da localhost o da un IP di rete privata (LAN).
const LOCAL_NETWORK_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+):\d+$/;

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : (origin, callback) => {
      if (!origin || LOCAL_NETWORK_ORIGIN_REGEX.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origine non consentita da CORS'));
      }
    };

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/actions', actionsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/members', membersRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Se sono presenti dei certificati TLS (es. generati con mkcert per lo sviluppo
// locale, oppure forniti dall'ambiente in produzione), avvia il server in HTTPS.
// Altrimenti si esegue in HTTP semplice, tipicamente dietro un reverse proxy
// (nginx) che termina già la connessione TLS.
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, '..', 'certs', 'localhost-key.pem');
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, '..', 'certs', 'localhost-cert.pem');

const hasSslCerts = fs.existsSync(SSL_KEY_PATH) && fs.existsSync(SSL_CERT_PATH);

if (hasSslCerts) {
  const httpsOptions = {
    key: fs.readFileSync(SSL_KEY_PATH),
    cert: fs.readFileSync(SSL_CERT_PATH),
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`FantaSAMAR server in ascolto su https://localhost:${PORT}`);
  });
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`FantaSAMAR server in ascolto su http://localhost:${PORT}`);
  });
}

# Guida al deployment di FantaSAMAR su server Linux

Questa guida spiega come installare ed eseguire il backend (`FantaSamar.Server`, Node.js + Express + SQLite) e il frontend (`FantaSamar`, Angular) su un server Linux (es. Ubuntu 22.04/24.04).

## 1. Prerequisiti

Aggiorna il sistema e installa Node.js (versione 20 LTS o superiore consigliata):

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git
node -v
npm -v
```

`build-essential` è necessario perché `better-sqlite3` compila moduli nativi in fase di installazione.

Installa anche `nginx` (per servire il frontend e fare da reverse proxy verso l'API) e `pm2` (per mantenere il backend sempre attivo):

```bash
sudo apt install -y nginx
sudo npm install -g pm2
```

## 2. Recupero del codice

```bash
cd /opt
sudo git clone <url-del-repository> fantasamar
sudo chown -R $USER:$USER /opt/fantasamar
cd /opt/fantasamar
```

Se non usi git, puoi caricare i file tramite `scp`/`rsync` mantenendo la stessa struttura di cartelle (`FantaSamar/` e `FantaSamar.Server/`).

## 3. Configurazione del backend (`FantaSamar.Server`)

```bash
cd /opt/fantasamar/FantaSamar.Server
npm install --production
```

### Variabili d'ambiente

Il backend legge `PORT` e `JWT_SECRET` dall'ambiente. Crea un file `.env` o esportale direttamente. Esempio con un file `.env` (richiede `dotenv`, oppure impostale come variabili di sistema/servizio):

```bash
export PORT=3000
export JWT_SECRET="una-chiave-segreta-lunga-e-casuale"
```

**Importante**: cambia sempre `JWT_SECRET` in produzione (il valore di default nel codice è solo per sviluppo).

### Avvio con PM2

```bash
cd /opt/fantasamar/FantaSamar.Server
pm2 start src/index.js --name fantasamar-server --env production
pm2 save
pm2 startup   # segui le istruzioni stampate per abilitare l'avvio automatico al boot
```

Verifica che il server risponda:

```bash
curl http://localhost:3000/api/health
# {"status":"ok"}
```

Il database SQLite viene creato automaticamente al primo avvio in `FantaSamar.Server/fantasamar.db`. Assicurati che la cartella sia scrivibile dall'utente che esegue il processo e includila nei backup.

## 4. Configurazione del frontend (`FantaSamar`)

### Aggiorna l'URL dell'API

Prima della build, aggiorna l'endpoint dell'API nel file:

```
FantaSamar/src/app/config/api.config.ts
```

Sostituisci:

```ts
export const API_BASE_URL = 'http://localhost:3000/api';
```

con l'indirizzo pubblico del server, ad esempio:

```ts
export const API_BASE_URL = 'https://tuo-dominio.it/api';
```

(oppure usa un path relativo `'/api'` se nginx fa da reverse proxy sullo stesso dominio, come nella configurazione proposta più sotto).

### Build di produzione

```bash
cd /opt/fantasamar/FantaSamar
npm install
npm run build
```

L'output compilato viene generato in `FantaSamar/dist/fanta-samar/browser` (il nome della sottocartella dipende dalla configurazione di Angular; verifica con `ls dist/`).

## 5. Configurazione di Nginx

Crea una configurazione che serva i file statici del frontend e faccia da reverse proxy per l'API Node.js:

```bash
sudo nano /etc/nginx/sites-available/fantasamar
```

Contenuto:

```nginx
server {
	listen 80;
	server_name tuo-dominio.it;

	root /opt/fantasamar/FantaSamar/dist/fanta-samar/browser;
	index index.html;

	# Frontend Angular (SPA fallback)
	location / {
		try_files $uri $uri/ /index.html;
	}

	# Proxy verso il backend Node.js
	location /api/ {
		proxy_pass http://127.0.0.1:3000/api/;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
		proxy_cache_bypass $http_upgrade;
	}
}
```

Se usi il path relativo `'/api'` in `api.config.ts`, questa configurazione funziona senza ulteriori modifiche CORS. Se invece usi un dominio/porta diversi per l'API, verifica che `cors()` nel backend (`FantaSamar.Server/src/index.js`) consenta l'origine del frontend.

Abilita il sito e ricarica nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fantasamar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. HTTPS con Let's Encrypt (consigliato)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tuo-dominio.it
```

Certbot configurerà automaticamente HTTPS e il rinnovo automatico del certificato.

## 7. Firewall

Se usi `ufw`:

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

La porta 3000 del backend non deve essere esposta pubblicamente: deve rimanere raggiungibile solo da `localhost` tramite il proxy nginx.

## 8. Aggiornamenti futuri

Per aggiornare l'applicazione dopo modifiche al codice:

```bash
cd /opt/fantasamar
git pull

# Backend
cd FantaSamar.Server
npm install --production
pm2 restart fantasamar-server

# Frontend
cd ../FantaSamar
npm install
npm run build
sudo systemctl reload nginx
```

## 9. Svuotare il database

Se necessario (ad esempio prima di un nuovo torneo), è possibile svuotare il database rimuovendo tutti gli utenti registrati e azzerando i punteggi dei membri SAMAR, senza toccare lo schema.

Crea uno script temporaneo nella cartella del backend:

```bash
cd /opt/fantasamar/FantaSamar.Server
nano cleanup-temp.js
```

Incolla il seguente contenuto:

```javascript
const { db } = require('./src/db');

const delUsers = db.prepare('DELETE FROM users').run();
console.log('Utenti rimossi:', delUsers.changes);

const delTeams = db.prepare('DELETE FROM teams').run();
console.log('Squadre rimosse:', delTeams.changes);

const delMemberPoints = db.prepare('DELETE FROM member_points').run();
console.log('Righe punteggio squadra rimosse:', delMemberPoints.changes);

const delActionRecords = db.prepare('DELETE FROM action_records').run();
console.log('Record azioni squadra rimossi:', delActionRecords.changes);

const resetGlobal = db.prepare('UPDATE member_global_points SET totalPoints = 0').run();
console.log('Punteggi globali membri azzerati:', resetGlobal.changes);

const clearGlobalRecords = db.prepare('DELETE FROM member_action_records').run();
console.log('Record azioni bonus globali rimossi:', clearGlobalRecords.changes);

const remainingUsers = db.prepare('SELECT id, username FROM users').all();
console.log('Utenti rimasti nel database:', remainingUsers);

const remainingTeams = db.prepare('SELECT id, name FROM teams').all();
console.log('Squadre rimaste nel database:', remainingTeams);

const points = db.prepare('SELECT memberId, totalPoints FROM member_global_points').all();
console.log('Punteggi membri dopo reset:', points);
```

Esegui lo script (arresta prima il processo PM2 per evitare accessi concorrenti al file SQLite):

```bash
pm2 stop fantasamar-server
cd /opt/fantasamar/FantaSamar.Server
node cleanup-temp.js
pm2 start fantasamar-server
```

Al termine, verifica l'output stampato a console (utenti rimasti, squadre rimaste, punteggi azzerati) e rimuovi lo script temporaneo, che non deve restare nel repository/server:

```bash
rm cleanup-temp.js
```

**Attenzione**: questa operazione è distruttiva e irreversibile (elimina tutti gli utenti registrati, le squadre e la cronologia delle azioni). Esegui un backup del file `fantasamar.db` prima di procedere, se necessario.

## 10. Comandi utili di gestione

```bash
pm2 status                     # stato dei processi
pm2 logs fantasamar-server      # log in tempo reale del backend
pm2 restart fantasamar-server   # riavvio manuale
sudo systemctl status nginx     # stato di nginx
sudo tail -f /var/log/nginx/error.log
```

## Riepilogo architettura

- **Backend**: Node.js + Express + better-sqlite3, in ascolto su `localhost:3000`, gestito da PM2.
- **Frontend**: build statica Angular servita da nginx.
- **Nginx**: reverse proxy per `/api/*` verso il backend e file statici per tutto il resto, con fallback SPA su `index.html`.
- **Database**: file SQLite (`fantasamar.db`) creato automaticamente al primo avvio del backend; da includere nei backup.

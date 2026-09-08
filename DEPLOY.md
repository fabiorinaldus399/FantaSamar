# Guida al deployment di FantaSAMAR su server Linux

Questa guida spiega come installare ed eseguire il backend (`FantaSamar.Server`, Node.js + Express + SQLite) e il frontend (`FantaSamar`, Angular) su un server Linux (es. Ubuntu 22.04/24.04).

## 0. Sviluppo locale in HTTPS con mkcert

Sia il backend (`FantaSamar.Server/src/index.js`) sia il frontend (`ng serve`, vedi `FantaSamar/angular.json`) sono predisposti per avviarsi automaticamente in **HTTPS** quando trovano dei certificati TLS locali. Per generarli in modo semplice si usa [mkcert](https://github.com/FiloSottile/mkcert), che crea certificati "trusted" dal browser senza dover configurare una CA reale.

### Installazione di mkcert

**Windows (PowerShell, con Chocolatey già installato):**

```powershell
choco install mkcert -y
mkcert -install
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt install -y libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
mkcert -install
```

**macOS:**

```bash
brew install mkcert
mkcert -install
```

Il comando `mkcert -install` installa una Certification Authority locale nel tuo browser/OS: è quello che rende i certificati generati "attendibili" senza warning nel browser.

### Generazione dei certificati

Genera due coppie di certificati, uno per il backend e uno per il frontend (puoi anche riutilizzare la stessa coppia in entrambe le cartelle):

```powershell
cd FantaSamar.Server
mkdir certs -Force
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost 127.0.0.1 ::1

cd ../FantaSamar
mkdir certs -Force
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost 127.0.0.1 ::1
```

Su Linux/macOS usa `mkdir -p certs` al posto di `mkdir certs -Force`.

I file generati (`certs/localhost-key.pem` e `certs/localhost-cert.pem`) sono esclusi dal repository tramite `.gitignore` e vanno rigenerati su ogni macchina di sviluppo.

### Accesso da altri dispositivi sulla rete locale (es. smartphone, altro PC)

Per aprire l'app da un altro dispositivo sulla stessa rete Wi-Fi/LAN servono 3 accorgimenti:

1. **Trova l'IP locale del PC che esegue backend e frontend**, ad esempio con:

   ```powershell
   ipconfig   # cerca "Indirizzo IPv4", es. 192.168.1.50
   ```

2. **Rigenera i certificati includendo anche quell'IP** (oltre a `localhost`), sia per il backend che per il frontend:

   ```powershell
   cd FantaSamar.Server
   mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost 127.0.0.1 ::1 192.168.1.50

   cd ../FantaSamar
   mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost-cert.pem localhost 127.0.0.1 ::1 192.168.1.50
   ```

   Sostituisci `192.168.1.50` con il tuo IP reale. Se l'IP cambia (es. rete diversa o DHCP), rigenera i certificati con il nuovo indirizzo.

3. **Assicurati che i server ascoltino su tutte le interfacce di rete (`0.0.0.0`) e non solo su `localhost`**:
   - Il backend (`FantaSamar.Server/src/index.js`) ascolta già su tutte le interfacce di default.
   - Il frontend è già configurato con `"host": "0.0.0.0"` in `FantaSamar/angular.json` e con lo script `npm start` (`ng serve --host=0.0.0.0`).

   In questo modo, oltre a `https://localhost:4200`, l'app sarà raggiungibile anche da `https://192.168.1.50:4200` (usa il tuo IP).

   Nota: sul dispositivo remoto (es. smartphone) il browser mostrerà un avviso di certificato non attendibile, perché la CA locale creata da `mkcert -install` è installata solo sul PC di sviluppo, non sul dispositivo remoto. Puoi comunque procedere accettando l'eccezione di sicurezza, oppure esportare/installare la CA di mkcert anche sul dispositivo remoto (`mkcert -CAROOT` mostra dove si trova il file `rootCA.pem` da importare).

   Il frontend (`FantaSamar/src/app/config/api.config.ts`) deduce automaticamente l'host dell'API dall'host con cui è stata aperta la pagina (`window.location.hostname`), quindi non serve modificare manualmente l'URL dell'API per l'accesso da rete locale: se apri `https://192.168.1.50:4200`, le chiamate andranno automaticamente a `https://192.168.1.50:3000/api`.

   Per default (senza impostare `CORS_ORIGIN`), il backend accetta automaticamente qualsiasi origine `localhost`/`127.0.0.1` o IP di rete privata (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`), quindi non serve configurare nulla lato CORS per l'uso in LAN.

### Avvio in HTTPS

```bash
# Backend: rileva automaticamente i certificati in FantaSamar.Server/certs/
cd FantaSamar.Server
npm run start   # oppure: node src/index.js

# Frontend: ng serve userà i certificati grazie alla configurazione ssl/sslKey/sslCert in angular.json
cd ../FantaSamar
npm start
```

Se i certificati non sono presenti, il backend torna automaticamente in HTTP semplice (utile in produzione, dove HTTPS viene terminato da nginx, vedi sezione 6).

Apri quindi `https://localhost:4200` nel browser: il frontend chiamerà l'API su `https://localhost:3000/api` (vedi `FantaSamar/src/app/config/api.config.ts`).

Se serve un'origine diversa per CORS (es. porta diversa), imposta la variabile d'ambiente `CORS_ORIGIN` (lista separata da virgole) prima di avviare il backend:

```bash
export CORS_ORIGIN="https://localhost:4200"
```

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

Il backend legge `PORT`, `JWT_SECRET`, `CORS_ORIGIN` e, opzionalmente, `SSL_KEY_PATH`/`SSL_CERT_PATH` dall'ambiente. Il modo più semplice per renderle persistenti tra i riavvii è usare un file `.env`: all'avvio (`FantaSamar.Server/src/index.js`) il pacchetto `dotenv` carica automaticamente `FantaSamar.Server/.env`, se presente.

Crea il file partendo dal template incluso nel repository:

```bash
cd /opt/fantasamar/FantaSamar.Server
cp .env.example .env
nano .env
```

Esempio di contenuto di `.env`:

```
PORT=3000
JWT_SECRET=una-chiave-segreta-lunga-e-casuale
CORS_ORIGIN=https://tuo-dominio.it
```

**Importante**:
- `.env` non va mai committato: è già escluso tramite `.gitignore`. Assicurati che i permessi del file siano restrittivi (es. `chmod 600 .env`), perché contiene segreti.
- Cambia sempre `JWT_SECRET` in produzione (il valore di default nel codice è solo per sviluppo).
- `CORS_ORIGIN` deve corrispondere all'origine pubblica del frontend (se non impostata, in sviluppo il backend accetta automaticamente le origini `localhost`/`127.0.0.1` e gli IP di rete privata).
- Se modifichi `.env` dopo l'avvio, riavvia il processo perché venga ricaricato (`pm2 restart fantasamar-server`), dato che le variabili vengono lette una sola volta all'avvio del processo Node.

In produzione il backend rimane in HTTP semplice dietro nginx (che termina la connessione TLS, vedi sezione 6); non è necessario impostare `SSL_KEY_PATH`/`SSL_CERT_PATH`. Se invece vuoi che sia il backend stesso a terminare la connessione HTTPS (ad esempio senza nginx davanti), aggiungi in `.env` `SSL_KEY_PATH` e `SSL_CERT_PATH` con i percorsi dei certificati reali (es. quelli emessi da Certbot in `/etc/letsencrypt/live/tuo-dominio.it/`) e il server si avvierà automaticamente in HTTPS, esattamente come descritto nella sezione 0 per lo sviluppo locale.

**In alternativa a `.env`** puoi impostare le variabili direttamente come variabili d'ambiente di sistema/servizio, ad esempio dentro l'unità systemd di PM2 o esportandole nella shell prima di avviare `pm2`:

```bash
export PORT=3000
export JWT_SECRET="una-chiave-segreta-lunga-e-casuale"
export CORS_ORIGIN="https://tuo-dominio.it"
```

Nota però che le variabili esportate nella shell valgono solo per la sessione corrente: dopo un riavvio del server vanno reimpostate manualmente, a meno di aggiungerle in un file caricato automaticamente (es. `/etc/environment`, un profilo di shell, o un file `.env`/`EnvironmentFile` systemd). Per questo `.env` è l'opzione consigliata per la persistenza tra i riavvii.

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
export const API_BASE_URL = 'https://localhost:3000/api';
```

con l'indirizzo pubblico del server, ad esempio:

```ts
export const API_BASE_URL = 'https://tuo-dominio.it/api';
```

(oppure usa un path relativo `'/api'` se nginx fa da reverse proxy sullo stesso dominio, come nella configurazione proposta più sotto).

### Feature flag

Il file `FantaSamar/src/app/config/feature-flags.config.ts` permette di abilitare/disabilitare alcune funzionalità dell'app impostando semplici valori `true`/`false`, senza dover modificare i componenti:

```ts
export const FEATURE_FLAGS = {
  showRegistration: true,       // Mostra la scheda "Registrazione" nella pagina di login
  showCreateTeamButton: true,   // Mostra il pulsante/form "Crea Nuova Squadra" nella dashboard
  showMyTeams: true,            // Mostra la sezione "Le Mie Squadre" nella dashboard
  showTeamLeaderboard: true,    // Mostra la sezione "Classifica Squadre" nella dashboard
};
```

Modifica i valori desiderati prima di eseguire la build di produzione (una modifica a questo file richiede sempre un rebuild del frontend, non è una variabile d'ambiente letta a runtime).

### Build di produzione

```bash
cd /opt/fantasamar/FantaSamar
npm install
npm run build
```

L'output compilato viene generato in `FantaSamar/dist/FantaSamar/browser` (verifica con `ls dist/FantaSamar/`).

## 5. Configurazione di Nginx

Crea una configurazione che serva i file statici del frontend e faccia da reverse proxy per l'API Node.js:

```bash
sudo nano /etc/nginx/sites-available/fantasamar
```

Contenuto (esempio con le porte standard 80/443; se il router usa porte non standard per il port forwarding — es. perché la 80/443 sono già occupate dalla GUI del firewall — adatta le `listen` di conseguenza, vedi nota sotto):

```nginx
server {
	listen 80;
	server_name tuo-dominio.it;

	root /opt/fantasamar/FantaSamar/dist/FantaSamar/browser;
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

Se usi il path relativo `'/api'` in `api.config.ts`, questa configurazione funziona senza ulteriori modifiche CORS. Se invece usi un dominio/porta diversi per l'API, verifica che la variabile `CORS_ORIGIN` nel backend (`FantaSamar.Server/src/index.js`) includa l'origine del frontend.

Abilita il sito e ricarica nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fantasamar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Porte non standard (es. router con GUI di gestione su 80/443)

Se il router/firewall (es. OPNsense) usa già le porte 80/443 pubbliche per la propria interfaccia di amministrazione, puoi far ascoltare nginx su porte diverse (es. `8080` per HTTP e `4443` per HTTPS) e configurare sul router un port forwarding dedicato:

- WAN:8080 → `<ip-server>`:8080 (TCP) — usata anche dalla sfida ACME HTTP-01 di Certbot
- WAN:4443 → `<ip-server>`:4443 (TCP) — servizio HTTPS pubblico dell'app

In questo caso la configurazione nginx (vedi anche [deploy/nginx-fantasamar.conf](deploy/nginx-fantasamar.conf) nel repository) diventa:

```nginx
server {
	listen 8080;
	server_name tuo-dominio.it;

	# Sfida ACME HTTP-01 per Certbot (validazione/rinnovo certificato)
	location /.well-known/acme-challenge/ {
		root /var/www/certbot;
	}

	# Redirect tutto il resto verso HTTPS sulla porta non standard
	location / {
		return 301 https://$host:4443$request_uri;
	}
}

server {
	listen 4443 ssl;
	server_name tuo-dominio.it;

	ssl_certificate     /etc/letsencrypt/live/tuo-dominio.it/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/tuo-dominio.it/privkey.pem;
	include /etc/letsencrypt/options-ssl-nginx.conf;
	ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

	root /opt/fantasamar/FantaSamar/dist/FantaSamar/browser;
	index index.html;

	location / {
		try_files $uri $uri/ /index.html;
	}

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

Nota: con porte non standard, l'app sarà raggiungibile pubblicamente su `https://tuo-dominio.it:4443` (la porta va sempre specificata nell'URL, non è omissibile). Ricorda di aggiornare `CORS_ORIGIN` nel backend includendo la porta, es. `CORS_ORIGIN=https://tuo-dominio.it:4443`.

Il file `/etc/letsencrypt/options-ssl-nginx.conf` e `/etc/letsencrypt/ssl-dhparams.pem` sono normalmente creati dal plugin `python3-certbot-nginx`; se non esistono (es. quando si usa `certbot certonly --webroot` invece del plugin nginx automatico), vanno creati manualmente prima del primo `nginx -t`:

```bash
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
sudo tee /etc/letsencrypt/options-ssl-nginx.conf > /dev/null << 'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
EOF
```

## 6. HTTPS con Let's Encrypt (consigliato)

**Prerequisito**: il dominio (es. un dominio no-ip) deve risolvere verso l'IP pubblico del router/firewall e deve esserci il **port forwarding** delle porte pubbliche verso il server (80/443, oppure 8080/4443 se si usano porte non standard come descritto sopra). Senza questo, Certbot non riesce a validare il dominio e la richiesta del certificato fallisce.

**Caso standard (porte 80/443 libere)**, con il plugin nginx che configura tutto automaticamente:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tuo-dominio.it
```

Certbot configurerà automaticamente HTTPS e il rinnovo automatico del certificato, modificando `/etc/nginx/sites-available/fantasamar` per aggiungere i blocchi `listen 443 ssl` e il redirect da HTTP a HTTPS.

**Caso porte non standard (es. 8080/4443)**: il plugin `--nginx` presume le porte 80/443, quindi va usata la modalità `webroot`, che valida il dominio scrivendo un file temporaneo servito dalla `location /.well-known/acme-challenge/` già presente nella configurazione della sezione 5:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d tuo-dominio.it \
  --non-interactive --agree-tos -m tua-email@esempio.it --no-eff-email
```

Il certificato viene salvato in `/etc/letsencrypt/live/tuo-dominio.it/` (`fullchain.pem` e `privkey.pem`), già referenziati nel blocco `listen 4443 ssl` della sezione 5. Dopo aver ottenuto il certificato la prima volta, esegui `nginx -t && sudo systemctl reload nginx` per applicarlo.

Il rinnovo automatico è gestito dal timer systemd `certbot.timer`, installato insieme al pacchetto; per verificarlo: `systemctl list-timers certbot.timer`. Poiché la modalità `webroot` richiede che nginx sia già attivo e serva `/.well-known/acme-challenge/` sulla porta usata per la validazione (8080 nell'esempio), il rinnovo funziona automaticamente senza fermare nginx.

Dopo aver ottenuto il certificato, se il backend usa `CORS_ORIGIN` esplicito (invece del rilevamento automatico LAN), aggiorna `.env` con l'origine pubblica definitiva, includendo la porta se non standard (es. `CORS_ORIGIN=https://tuo-dominio.it:4443`), e riavvia il backend (`pm2 restart fantasamar-server`).

## 7. Firewall

Su alcune distribuzioni minimali (es. Debian netinst) `ufw` non è installato di default; se il comando `ufw` non è disponibile non c'è un firewall applicativo attivo lato server e il traffico è filtrato solo dal router/firewall di rete. Per installarlo e abilitarlo:

```bash
sudo apt install -y ufw
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

La porta 3000 del backend non deve essere esposta pubblicamente (né tramite `ufw` né tramite il port forwarding del router): deve rimanere raggiungibile solo da `localhost` tramite il proxy nginx. Il port forwarding sul router va configurato solo per le porte 80/443 verso il server.

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

# FantaSAMAR - Applicazione Web

Benvenuto in **FantaSAMAR**, un'applicazione web ispirata a FantaSanremo che permette di creare squadre composte dai 7 membri del gruppo musicale SAMAR e gestire i loro punti (cipolle)!

## 🎯 Caratteristiche Principali

### 1. **Autenticazione**
- Registrazione di nuovi utenti
- Login con username e password
- Persistenza della sessione tramite localStorage

### 2. **Gestione Squadre**
- Creazione di squadre personalizzate con esattamente 5 membri scelti tra i 7 di SAMAR
- Visualizzazione di tutte le squadre create
- Modifica e eliminazione di squadre
- Monitoraggio dei punti totali della squadra

### 3. **Assegnazione Punti (Cipolle)**
- Selezione di un membro della squadra
- Applicazione di azioni predefinite per aumentare/diminuire i punti
- Storico completo di tutte le azioni applicate ad ogni membro
- Rimozione di azioni specifiche

### 4. **Gestione Azioni Globali**
- Creazione di nuove azioni personalizzate (globali per tutti gli utenti)
- Ogni azione ha:
  - Nome (es: Goal, Assist, Cartellino Giallo, etc.)
  - Descrizione
  - Punti/Cipolle associati
  - Tipo (positivo o negativo)
- Modifica e eliminazione di azioni
- Azioni predefinite incluse (Goal, Assist, Cartellino Giallo, Cartellino Rosso, Gol Mantenuto)

### 5. **Membri SAMAR**
I 7 membri del gruppo SAMAR disponibili sono:
1. Marco - Cantante
2. Luca - Chitarrista
3. Federico - Bassista
4. Antonio - Batterista
5. Davide - Tastierista
6. Simone - Voce
7. Gabriele - Produttore

## 🚀 Come Iniziare

### Requisiti
- Node.js (v18+)
- npm (v10+)
- Angular CLI (v21+)

### Installazione

```bash
# 1. Navigare nella directory del progetto
cd FantaSamar

# 2. Installare le dipendenze
npm install

# 3. Avviare il server di sviluppo
npm start

# 4. Aprire il browser
# L'applicazione sarà disponibile su http://localhost:4200
```

## 📋 Guida Utente

### Registration
1. Alla prima apertura, selezionare il tab "Registrazione"
2. Inserire username, email e password
3. Confermare la password
4. Cliccare "Registrati"

### Login
1. Inserire username e password
2. Cliccare "Accedi"
3. Accesso alla dashboard

### Creare una Squadra
1. Dalla dashboard, cliccare su "Crea Nuova Squadra"
2. Inserire il nome della squadra
3. Selezionare esattamente 5 membri dai 7 di SAMAR
4. Cliccare "Crea Squadra"

### Gestire i Punti
1. Dalla dashboard, cliccare su "Dettagli" nel riquadro della squadra
2. Selezionare un membro dal pannello di sinistra
3. Nel pannello centrale, visualizzare e assegnare azioni
4. I punti verranno aggiornati automaticamente
5. Visualizzare lo storico delle azioni applicate

### Gestire le Azioni Globali
1. Nel pannello di destra, cliccare su "Crea Nuova Azione"
2. Compilare i dettagli dell'azione:
   - Nome
   - Descrizione
   - Tipo (Positivo o Negativo)
   - Numero di Cipolle
3. Cliccare "Crea Azione"
4. L'azione sarà disponibile per tutti gli utenti
5. È possibile eliminare azioni personalizzate

## 🗂️ Struttura del Progetto

```
FantaSamar/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── login/                 # Componente login/registrazione
│   │   │   ├── dashboard/             # Dashboard principale
│   │   │   └── team-detail/           # Dettagli squadra e gestione punti
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Gestione autenticazione
│   │   │   ├── team.service.ts        # Gestione squadre
│   │   │   ├── action.service.ts      # Gestione azioni/cipolle
│   │   │   └── samar.service.ts       # Dati membri SAMAR
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── team.model.ts
│   │   │   ├── action.model.ts
│   │   │   ├── samar-member.model.ts
│   │   │   └── member-points.model.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # Protezione rotte autenticate
│   │   ├── app-routing-module.ts      # Configurazione routing
│   │   ├── app-module.ts              # Modulo principale
│   │   └── app.ts                     # Componente root
│   └── main.ts
└── package.json
```

## 💾 Persistenza Dati

I dati sono salvati in `localStorage`:
- **users**: Elenco utenti registrati
- **teams**: Squadre create da ciascun utente
- **actions**: Azioni/cipolle disponibili globalmente
- **currentUserId**: ID dell'utente attualmente loggato

## 🎨 Design

L'applicazione utilizza un design moderno con:
- Gradient background viola/blu
- Componenti in stile card
- Interfaccia responsiva
- Transizioni fluide
- Icone emoji per i punti (🌶️ cipolle, ✕ rimuovi)

## 🔒 Sicurezza

⚠️ **Nota**: Questa è una versione prototipo con localStorage. Per un'applicazione di produzione:
- Implementare un backend con autenticazione JWT
- Utilizzare hash per le password
- Implementare HTTPS
- Validazione lato server

## 📱 Compatibilità

- Chrome (v 90+)
- Firefox (v 88+)
- Safari (v 14+)
- Edge (v 90+)

## 🛠️ Comandi Disponibili

```bash
# Avviare il server di sviluppo
npm start

# Build per produzione
npm run build

# Eseguire test
npm test

# Watch per rebuild automatico
npm run watch
```

## 💡 Suggerimenti per l'Utilizzo

1. **Creare Azioni Significative**: Personalizza le azioni in base ai criteri che desideri tracciare
2. **Monitorare le Prestazioni**: Usa il totale dei punti della squadra come indicatore di successo
3. **Leggere le Descrizioni**: Le descrizioni delle azioni aiutano a ricordare i criteri

## 🐛 Troubleshooting

**Il server non si avvia**
```bash
# Pulire i dati della cache
rm -rf node_modules package-lock.json
npm install
npm start
```

**I dati non vengono salvati**
- Verificare che localStorage sia abilitato nel browser
- Controllare se il browser non è in modalità privata

**Non riesco a fare login**
- Verificare che l'username sia esatto (case-sensitive)
- Accertarsi di essersi registrato prima

## 📞 Supporto

Per problemi o suggerimenti, consultare la documentazione di Angular:
- [Angular Official Docs](https://angular.io)
- [Angular CLI](https://angular.io/cli)

---

**Divertiti con FantaSAMAR! 🎵🌶️**

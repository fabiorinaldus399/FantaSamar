# ✨ FantaSAMAR - Setup e Utilizzo

## 🚀 Quick Start

### Avvio Immediato
```bash
cd FantaSamar
npm start
```

L'applicazione sarà disponibile su **http://localhost:52598/** (o la porta indicata nel terminale)

## 📖 Guida Completa

Per consultare la guida dettagliata su funzionalità, autenticazione e gestione delle squadre, leggi:
👉 **[FANTASAMAR_GUIDE.md](./FANTASAMAR_GUIDE.md)**

## 🏗️ Struttura del Progetto

```
FantaSamar/
├── src/app/
│   ├── components/          # Componenti UI
│   ├── services/           # Servizi di business logic
│   ├── models/             # Interfacce TypeScript
│   ├── guards/             # Route guards
│   └── app-routing-module.ts
├── public/                 # Risorse statiche
├── package.json
└── tsconfig.json
```

## 🎯 Caratteristiche Principali

✅ **Autenticazione**: Login e registrazione utenti
✅ **Gestione Squadre**: Crea squadre di 5 membri su 7
✅ **Assegnazione Punti**: Cipolle (*🌶️*) per ogni membro
✅ **Azioni Globali**: Crea azioni personalizzate per tutti gli utenti
✅ **Storico**: Tracciamento completo di tutte le azioni

## 💾 Dati Persistenti

Tutti i dati sono salvati in **localStorage** del browser:
- Utenti registrati
- Squadre create
- Azioni globali
- Punti assegnati

## 🛠️ Comandi Disponibili

```bash
# Avvio server
npm start

# Build produzione
npm run build

# Test
npm test

# Watch (rebuild automatico)
npm run watch
```

## ⚙️ Configurazione

### Angular CLI
L'applicazione utilizza Angular 21.2 con supporto completo per:
- Standalone components
- TypeScript strict mode
- RxJS observables

### Dipendenze Principali
- `@angular/core` - Framework Angular
- `@angular/router` - Routing
- `@angular/forms` - Form handling
- `rxjs` - Reactive programming

## 🔒 Note sulla Sicurezza

⚠️ Questa è una **versione prototipo** con localStorage. Per produzione:
- Implementare backend Node.js/Express
- Utilizzo JWT per autenticazione
- Hash SHA-256 per password
- HTTPS obbligatorio
- Database (MongoDB/PostgreSQL)

## 📱 Compatibilità Browser

| Browser | Min. Version |
|---------|-------------|
| Chrome  | 90+         |
| Firefox | 88+         |
| Safari  | 14+         |
| Edge    | 90+         |

## 🆘 Troubleshooting

### Porta già in uso
```bash
# Usare porta differente
ng serve --port 4201
```

### Pulire cache e reinstallare
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### localStorage non funziona
- Disattivare modalità privata browser
- Controllare consenso cookie
- Verificare storage abilitato (DevTools)

## 📞 Supporto

Per problemi tecnici:
- Consultare [Angular Docs](https://angular.io)
- Verificare la console del browser (F12)
- Controllare i log di npm

---

**Buon divertimento con FantaSAMAR! 🎵🌶️**

# Copilot Instructions

## Linee guida del progetto
- Nel progetto Angular FantaSamar, il polyfill zone.js deve essere dichiarato esplicitamente in angular.json (chiave 'polyfills': ['zone.js']) e come dipendenza in package.json; la sua assenza causa mancato aggiornamento della UI dopo risposte HTTP asincrone (change detection non innescata).
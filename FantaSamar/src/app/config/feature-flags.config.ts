// Configurazione dei feature flag del frontend: permette di abilitare/disabilitare
// alcune funzionalità dell'app impostando semplicemente `true`/`false`, senza
// dover modificare i componenti. Utile per adattare l'app a diversi contesti
// di utilizzo (es. disabilitare la registrazione dopo l'iscrizione iniziale
// dei partecipanti, o nascondere sezioni non ancora pronte).
export const FEATURE_FLAGS = {
  // Mostra la scheda "Registrazione" e il relativo form nella pagina di login.
  // Se `false`, nella pagina di login sarà disponibile solo il login.
  showRegistration: true,

  // Mostra il pulsante "Crea Nuova Squadra" e il form di creazione squadra
  // nella dashboard.
  showCreateTeamButton: true,

  // Mostra la sezione "Le Mie Squadre" nella dashboard.
  showMyTeams: true,

  // Mostra la sezione "Classifica Squadre" nella dashboard.
  showTeamLeaderboard: true,
};

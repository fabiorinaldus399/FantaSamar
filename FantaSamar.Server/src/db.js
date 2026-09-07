const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'fantasamar.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS samar_members (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      points INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('positive', 'negative')),
      scope TEXT NOT NULL CHECK (scope IN ('single', 'group')),
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      isGlobal INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      userId TEXT NOT NULL,
      memberIds TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS member_global_points (
      memberId INTEGER PRIMARY KEY,
      totalPoints INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS member_action_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberId INTEGER NOT NULL,
      actionId TEXT NOT NULL,
      actionName TEXT NOT NULL,
      points INTEGER NOT NULL,
      appliedAt TEXT NOT NULL,
      FOREIGN KEY (memberId) REFERENCES samar_members(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS member_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teamId TEXT NOT NULL,
      memberId INTEGER NOT NULL,
      totalPoints INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
      UNIQUE (teamId, memberId)
    );

    CREATE TABLE IF NOT EXISTS action_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memberPointsId INTEGER NOT NULL,
      actionId TEXT NOT NULL,
      actionName TEXT NOT NULL,
      points INTEGER NOT NULL,
      appliedAt TEXT NOT NULL,
      FOREIGN KEY (memberPointsId) REFERENCES member_points(id) ON DELETE CASCADE
    );
  `);
}

function migrateDropEmailColumn() {
  const columns = db.prepare("PRAGMA table_info(users)").all();
  const hasEmail = columns.some((col) => col.name === 'email');
  if (!hasEmail) return;

  db.exec(`
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    INSERT INTO users_new (id, username, passwordHash, createdAt)
    SELECT id, username, passwordHash, createdAt FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
  `);
}

function migrateLegacyTeamPointsToGlobal() {
  const globalCount = db.prepare('SELECT COUNT(*) as c FROM member_global_points').get().c;
  if (globalCount > 0) return;

  const legacyRows = db.prepare('SELECT memberId, SUM(totalPoints) as total FROM member_points GROUP BY memberId').all();
  if (legacyRows.length === 0) return;

  const insert = db.prepare('INSERT INTO member_global_points (memberId, totalPoints) VALUES (@memberId, @total)');
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(legacyRows);
}

function seedSamarMembers() {
  const members = [
    { id: 1, name: 'David', role: 'Zzziohhhh' },
    { id: 2, name: 'Fra', role: 'Project Manager' },
    { id: 3, name: 'Jhonny', role: 'al volo?' },
    { id: 4, name: 'Feb', role: 'EEEEEEEE OH' },
    { id: 5, name: 'Edo', role: 'Poche stronzate' },
    { id: 6, name: 'Fabio', role: 'Concentrazione...' },
    { id: 7, name: 'Nico', role: 'Taxi driver' }
  ];

  const count = db.prepare('SELECT COUNT(*) as c FROM samar_members').get().c;

  if (count === 0) {
    const insert = db.prepare('INSERT INTO samar_members (id, name, role) VALUES (@id, @name, @role)');
    const insertMany = db.transaction((rows) => {
      for (const row of rows) insert.run(row);
    });
    insertMany(members);
  } else {
    const update = db.prepare('UPDATE samar_members SET name = @name, role = @role WHERE id = @id');
    const updateMany = db.transaction((rows) => {
      for (const row of rows) update.run(row);
    });
    updateMany(members);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function seedDefaultActions() {
  const count = db.prepare('SELECT COUNT(*) as c FROM actions').get().c;
  if (count > 0) return;

  const now = new Date().toISOString();
  const defaultActions = [
    // BONUS SINGOLO
    { name: 'Fumarsi una canna la sera', points: 5, type: 'positive', scope: 'single' },
    { name: 'Cit Shrek', points: -5, type: 'negative', scope: 'single' },
    { name: 'Al volo e derivati', points: -20, type: 'negative', scope: 'single' },
    { name: 'Le patatone su Fabio Rina', points: 50, type: 'positive', scope: 'single' },
    { name: 'Drop emote 🫰', points: -5, type: 'negative', scope: 'single' },
    { name: 'Nico che ci prova con una ragazza', points: -5, type: 'negative', scope: 'single' },
    { name: 'Qualcuno prende un palo', points: -10, type: 'negative', scope: 'single' },
    { name: 'Primo sveglio la mattina', points: 5, type: 'positive', scope: 'single' },
    { name: 'Guidi la sera', points: 10, type: 'positive', scope: 'single' },
    { name: 'Dimentichi il testo', points: -5, type: 'negative', scope: 'single' },
    { name: 'Stecca errore', points: -10, type: 'negative', scope: 'single' },
    { name: 'Edo e Nico si tolgono la maglietta', points: -10, type: 'negative', scope: 'single' },
    { name: 'Qualcuna ci prova con te', points: 20, type: 'positive', scope: 'single' },
    { name: 'Problemi attrezzatura', points: -5, type: 'negative', scope: 'group' },
    { name: 'Dimentichi qualcosa a casa', points: -20, type: 'negative', scope: 'single' },
    { name: 'Fra offre il pranzo', points: 50, type: 'positive', scope: 'single' },
    { name: 'La keytar smette di andare', points: -30, type: 'negative', scope: 'single' },
    { name: 'David non russa', points: 10, type: 'positive', scope: 'single' },
    { name: 'Nico si fa la doccia prima di andare a letto', points: 10, type: 'positive', scope: 'single' },
    { name: 'Inciampi tornando a casa', points: -15, type: 'negative', scope: 'single' },
    { name: 'Pisciare in giro', points: 10, type: 'positive', scope: 'single' },
    { name: 'Ti offrono qualcosa', points: 10, type: 'positive', scope: 'single' },
    { name: 'Chiedono una canzone di Guccini', points: 10, type: 'positive', scope: 'single' },
    { name: 'David deve improvvisare una canzone', points: 10, type: 'positive', scope: 'single' },
    { name: 'Qualcuno ti chiede di suonare/cantare con te', points: 10, type: 'positive', scope: 'single' },
    { name: 'Inventi un nuovo tormentone', points: 25, type: 'positive', scope: 'single' },
    { name: 'Fra parla del suo lavoro', points: -20, type: 'negative', scope: 'single' },
    { name: 'Nico parla della palestra', points: -20, type: 'negative', scope: 'single' },
    { name: 'Jho dice facciaml', points: -5, type: 'negative', scope: 'single' },
    { name: 'Uno della band dice qualcosa in dialetto', points: -5, type: 'negative', scope: 'single' },
    { name: 'Fra ti fa un side eye', points: 1, type: 'positive', scope: 'single' },

    // BONUS GRUPPO
    { name: 'Certe notti senza errori', points: 5, type: 'positive', scope: 'group' },
    { name: 'Fra non si lamenta', points: 10, type: 'positive', scope: 'group' },
    { name: 'Perdiamo chiavi casa', points: -100, type: 'negative', scope: 'group' },
    { name: 'Qualcuno in ospedale', points: -200, type: 'negative', scope: 'group' },
    { name: 'Fra si ubriaca', points: 100, type: 'positive', scope: 'group' },
    { name: 'Notte di fuoco', points: 30, type: 'positive', scope: 'group' },
    { name: 'Qualcuno sbratta', points: -50, type: 'negative', scope: 'group' },
    { name: 'Conto voidless', points: 30, type: 'positive', scope: 'group' },
    { name: 'Fra offre il pranzo (gruppo)', points: 200, type: 'positive', scope: 'group' },
    { name: 'La keytar smette di andare (gruppo)', points: -30, type: 'negative', scope: 'group' },
    { name: 'Danneggiare proprio strumento', points: -10, type: 'negative', scope: 'group' },
    { name: 'La gente canta le nostre canzoni', points: 50, type: 'positive', scope: 'group' },
    { name: 'La gente ti lascia mance', points: 30, type: 'positive', scope: 'group' },
    { name: 'Diego Spagnoli emote', points: -10, type: 'negative', scope: 'group' },
    { name: 'Fabio fuma una sigaretta', points: -10, type: 'negative', scope: 'group' },
    { name: 'Jho si denuda', points: -30, type: 'negative', scope: 'group' },
    { name: 'Violenza nella band', points: -15, type: 'negative', scope: 'group' },
    { name: "Ma ce l'avete un cd?", points: 10, type: 'positive', scope: 'group' },
    { name: 'Si spegne il telefono', points: -10, type: 'negative', scope: 'group' },
    { name: 'Pronunciano male il tuo nome', points: -5, type: 'negative', scope: 'group' }
  ];

  const insert = db.prepare(`
    INSERT INTO actions (id, name, points, type, scope, createdBy, createdAt, isGlobal)
    VALUES (@id, @name, @points, @type, @scope, @createdBy, @createdAt, 1)
  `);

  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run({
        id: generateId(),
        createdBy: 'system',
        createdAt: now,
        ...row
      });
    }
  });
  insertMany(defaultActions);
}

function initDatabase() {
  initSchema();
  migrateDropEmailColumn();
  seedSamarMembers();
  seedDefaultActions();
  migrateLegacyTeamPointsToGlobal();
}

module.exports = { db, initDatabase, generateId };

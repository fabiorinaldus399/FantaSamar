const { db } = require('./src/db');

const del = db.prepare("DELETE * FROM users").run();
console.log('Utenti rimossi:', del.changes);

const reset = db.prepare('UPDATE member_global_points SET totalPoints = 0').run();
console.log('Righe punteggio azzerate:', reset.changes);

const clearRecords = db.prepare('DELETE FROM member_action_records').run();
console.log('Record azioni bonus rimossi:', clearRecords.changes);

const remaining = db.prepare('SELECT id, username FROM users').all();
console.log('Utenti rimasti nel database:', remaining);

const points = db.prepare('SELECT memberId, totalPoints FROM member_global_points').all();
console.log('Punteggi membri dopo reset:', points);

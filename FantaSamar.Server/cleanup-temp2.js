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

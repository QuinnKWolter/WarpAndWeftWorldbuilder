import { openDatabase } from '../src/lib/server/db';
const { sqlite } = openDatabase();
sqlite.close();
console.log('Storygraph database is ready.');

import { openDatabase } from '../src/lib/server/db';
const { sqlite } = openDatabase();
sqlite.close();
console.log('Warp & Weft Worldbuilder database is ready.');

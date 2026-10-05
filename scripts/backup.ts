import { openDatabase } from '../src/lib/server/db';
import { mkdirSync } from 'node:fs';
const { sqlite } = openDatabase();
mkdirSync('data/backups',{recursive:true});
const filename = `data/backups/storygraph-${new Date().toISOString().replace(/[:.]/g,'-')}.db`;
await sqlite.backup(filename); sqlite.close(); console.log(`Backup saved to ${filename}`);

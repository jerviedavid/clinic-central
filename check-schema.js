import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'prisma', 'dev.db');

const db = new Database(dbPath);
const info = db.pragma('table_info(User)');
console.log('User table info:', info);

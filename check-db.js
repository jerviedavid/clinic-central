import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'prisma', 'dev.db');

const db = new Database(dbPath);
const users = db.prepare('SELECT id, email, fullName, role FROM User').all();
console.log('Users:', users);

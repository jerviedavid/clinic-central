import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'prisma', 'dev.db');

// Use better-sqlite3 for all database operations
// Prisma Client can be added later if needed
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export default db;

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('./prisma/dev.db');

const email = 'danilwilliam401@gmail.com';
const password = 'T8]fgy!k~yg#)P"';
const fullName = 'Test User';

// Hash the password
const hashedPassword = bcrypt.hashSync(password, 10);

// Check if user already exists
const existingUser = db.prepare('SELECT id FROM User WHERE email = ?').get(email);

if (existingUser) {
    console.log('User already exists!');
    db.close();
    process.exit(0);
}

// Create the user
const result = db.prepare(`
    INSERT INTO User (email, password, fullName, emailVerified, createdAt)
    VALUES (?, ?, ?, ?, ?)
`).run(email, hashedPassword, fullName, 1, new Date().toISOString());

console.log('✅ User created successfully!');
console.log(`User ID: ${result.lastInsertRowid}`);
console.log(`Email: ${email}`);
console.log(`Full Name: ${fullName}`);

db.close();

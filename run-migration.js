import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'prisma', 'dev.db');
const migrationPath = join(__dirname, 'prisma', 'migrations', '001_multi_clinic_rbac.sql');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try {
    console.log('📦 Running migration...');

    // Read and execute migration SQL
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    db.exec(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Seed default roles
    console.log('🌱 Seeding roles...');

    const insertRole = db.prepare('INSERT OR IGNORE INTO Role (name) VALUES (?)');
    insertRole.run('DOCTOR');
    insertRole.run('RECEPTIONIST');
    insertRole.run('ADMIN');

    console.log('✅ Roles seeded successfully!');

    // Migrate existing users
    console.log('👥 Migrating existing users...');

    const users = db.prepare('SELECT * FROM User').all();

    for (const user of users) {
        // Create a clinic for each user
        const clinicInfo = db.prepare(
            'INSERT INTO Clinic (name, createdAt) VALUES (?, CURRENT_TIMESTAMP)'
        ).run(`${user.fullName}'s Clinic`);

        const clinicId = clinicInfo.lastInsertRowid;

        // Get role IDs
        const doctorRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('DOCTOR');
        const receptionistRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('RECEPTIONIST');
        const adminRole = db.prepare('SELECT id FROM Role WHERE name = ?').get('ADMIN');

        // Assign roles based on old role field
        if (user.role === 'doctor') {
            // Doctors get both DOCTOR and ADMIN roles
            db.prepare(
                'INSERT INTO ClinicUser (userId, clinicId, roleId) VALUES (?, ?, ?)'
            ).run(user.id, clinicId, doctorRole.id);

            db.prepare(
                'INSERT INTO ClinicUser (userId, clinicId, roleId) VALUES (?, ?, ?)'
            ).run(user.id, clinicId, adminRole.id);
        } else if (user.role === 'receptionist') {
            // Receptionists get RECEPTIONIST role
            db.prepare(
                'INSERT INTO ClinicUser (userId, clinicId, roleId) VALUES (?, ?, ?)'
            ).run(user.id, clinicId, receptionistRole.id);
        }

        console.log(`  ✓ Migrated user: ${user.email} (${user.role})`);
    }

    console.log('✅ User migration completed!');

    // Drop the old role column from User table
    console.log('🔧 Removing old role column...');

    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    db.exec(`
    -- Create new User table without role column
    CREATE TABLE User_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      lastLogin DATETIME
    );
    
    -- Copy data from old table
    INSERT INTO User_new (id, email, password, fullName, createdAt, lastLogin)
    SELECT id, email, password, fullName, createdAt, lastLogin FROM User;
    
    -- Drop old table
    DROP TABLE User;
    
    -- Rename new table
    ALTER TABLE User_new RENAME TO User;
  `);

    console.log('✅ Old role column removed!');
    console.log('🎉 All migrations completed successfully!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
} finally {
    db.close();
}

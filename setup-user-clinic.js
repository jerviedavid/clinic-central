import Database from 'better-sqlite3';

const db = new Database('./prisma/dev.db');

const email = 'danilwilliam401@gmail.com';

// Get user
const user = db.prepare('SELECT id, email FROM User WHERE email = ?').get(email);

if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
}

console.log(`Found user: ${user.email} (ID: ${user.id})`);

// Create a default clinic
const clinicResult = db.prepare(`
    INSERT INTO Clinic (name, address, phone, email, createdAt)
    VALUES (?, ?, ?, ?, ?)
`).run('Default Clinic', '123 Main Street', '555-0100', email, new Date().toISOString());

const clinicId = clinicResult.lastInsertRowid;
console.log(`✅ Created clinic: Default Clinic (ID: ${clinicId})`);

// Get ADMIN role
const adminRole = db.prepare("SELECT * FROM Role WHERE name = 'ADMIN'").get();

if (!adminRole) {
    console.log('❌ ADMIN role not found!');
    process.exit(1);
}

// Assign user to clinic as ADMIN
db.prepare(`
    INSERT INTO ClinicUser (userId, clinicId, roleId, createdAt)
    VALUES (?, ?, ?, ?)
`).run(user.id, clinicId, adminRole.id, new Date().toISOString());

console.log(`✅ User assigned to clinic as ${adminRole.name}`);

// Show all clinic associations
const associations = db.prepare(`
    SELECT c.name as clinicName, r.name as roleName
    FROM ClinicUser cu
    JOIN Clinic c ON cu.clinicId = c.id
    JOIN Role r ON cu.roleId = r.id
    WHERE cu.userId = ?
`).all(user.id);

console.log('\nUser clinic associations:');
associations.forEach(assoc => {
    console.log(`  - ${assoc.clinicName}: ${assoc.roleName}`);
});

db.close();

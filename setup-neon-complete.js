import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { readFileSync, existsSync } from 'fs';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_89pjVAZBzQkn@ep-dark-wildflower-a1sr8phq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

async function setupDatabase() {
  console.log('🔄 Setting up Neon PostgreSQL database...\n');

  // Drop all existing tables (in reverse dependency order)
  console.log('Dropping existing tables...');
  await sql`DROP TABLE IF EXISTS "Payment" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Subscription" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Plan" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Invite" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Patient" CASCADE`;
  await sql`DROP TABLE IF EXISTS "ClinicUser" CASCADE`;
  await sql`DROP TABLE IF EXISTS "ReceptionistProfile" CASCADE`;
  await sql`DROP TABLE IF EXISTS "DoctorProfile" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Invoice" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Prescription" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Appointment" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Medicine" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Role" CASCADE`;
  await sql`DROP TABLE IF EXISTS "Clinic" CASCADE`;
  await sql`DROP TABLE IF EXISTS "User" CASCADE`;
  await sql`DROP TABLE IF EXISTS "SubscriptionPlan" CASCADE`;
  await sql`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE`;
  console.log('✅ Old tables dropped\n');

  // Create all tables
  console.log('Creating tables...');

  await sql`
    CREATE TABLE "User" (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      "fullName" TEXT NOT NULL,
      "profileImage" TEXT,
      "tempPassword" TEXT,
      "emailVerified" BOOLEAN DEFAULT false,
      "verificationToken" TEXT,
      "verificationExpires" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "lastLogin" TIMESTAMPTZ
    )
  `;
  console.log('  ✅ User');

  await sql`
    CREATE TABLE "DoctorProfile" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      specialization TEXT,
      subspecialty TEXT,
      "licenseNumber" TEXT,
      "prcId" TEXT,
      bio TEXT,
      "consultationFee" DOUBLE PRECISION,
      "clinicHours" TEXT,
      "digitalSignature" TEXT,
      "ptrTaxId" TEXT,
      "ePrescriptionId" TEXT,
      education TEXT,
      experience INTEGER,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ DoctorProfile');

  await sql`
    CREATE TABLE "ReceptionistProfile" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "dateOfBirth" TEXT,
      address TEXT,
      phone TEXT,
      "emergencyContactName" TEXT,
      "emergencyContactPhone" TEXT,
      position TEXT,
      "yearsOfExperience" INTEGER,
      skills TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ ReceptionistProfile');

  await sql`
    CREATE TABLE "Appointment" (
      id SERIAL PRIMARY KEY,
      "patientName" TEXT NOT NULL,
      "patientPhone" TEXT,
      "patientEmail" TEXT,
      "patientAge" TEXT,
      "patientGender" TEXT,
      "doctorName" TEXT NOT NULL,
      "appointmentDate" TEXT NOT NULL,
      "appointmentTime" TEXT,
      "appointmentType" TEXT,
      status TEXT DEFAULT 'scheduled',
      "tokenNumber" TEXT,
      notes TEXT,
      symptoms TEXT,
      "medicalHistory" TEXT,
      medications TEXT,
      "vitalSigns" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Appointment');

  await sql`
    CREATE TABLE "Prescription" (
      id SERIAL PRIMARY KEY,
      "patientName" TEXT NOT NULL,
      "patientAge" TEXT,
      "patientGender" TEXT,
      "patientPhone" TEXT,
      "patientEmail" TEXT,
      "prescriptionDate" TEXT,
      diagnosis TEXT,
      symptoms TEXT,
      "doctorId" INTEGER,
      "doctorName" TEXT NOT NULL,
      medicines TEXT,
      instructions TEXT,
      "followUpDate" TEXT,
      status TEXT,
      notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Prescription');

  await sql`
    CREATE TABLE "Medicine" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      strength TEXT,
      form TEXT,
      manufacturer TEXT,
      description TEXT,
      "sideEffects" TEXT,
      contraindications TEXT,
      "dosageInstructions" TEXT,
      "storageInstructions" TEXT,
      price DOUBLE PRECISION,
      "stockQuantity" INTEGER,
      "reorderLevel" INTEGER,
      "isActive" BOOLEAN DEFAULT true,
      "createdBy" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Medicine');

  await sql`
    CREATE TABLE "Invoice" (
      id SERIAL PRIMARY KEY,
      "invoiceNumber" TEXT,
      "patientName" TEXT NOT NULL,
      "patientPhone" TEXT,
      "patientEmail" TEXT,
      items TEXT,
      "totalAmount" DOUBLE PRECISION NOT NULL,
      status TEXT DEFAULT 'pending',
      "paymentMethod" TEXT,
      "paymentDate" TEXT,
      "paymentReference" TEXT,
      "paymentNotes" TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Invoice');

  await sql`
    CREATE TABLE "Payment" (
      id SERIAL PRIMARY KEY,
      "invoiceId" INTEGER,
      "invoiceNumber" TEXT,
      "patientName" TEXT,
      "patientPhone" TEXT,
      amount DOUBLE PRECISION,
      method TEXT,
      reference TEXT,
      notes TEXT,
      "processedBy" TEXT,
      "processedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Payment');

  await sql`
    CREATE TABLE "Clinic" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Clinic');

  await sql`
    CREATE TABLE "Role" (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL
    )
  `;
  console.log('  ✅ Role');

  await sql`
    CREATE TABLE "ClinicUser" (
      id SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "clinicId" INTEGER NOT NULL REFERENCES "Clinic"(id) ON DELETE CASCADE,
      "roleId" INTEGER NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE ("userId", "clinicId", "roleId")
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_clinicuser_userid ON "ClinicUser"("userId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_clinicuser_clinicid ON "ClinicUser"("clinicId")`;
  console.log('  ✅ ClinicUser');

  await sql`
    CREATE TABLE "Invite" (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      "clinicId" INTEGER NOT NULL REFERENCES "Clinic"(id) ON DELETE CASCADE,
      "roleId" INTEGER NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      "expiresAt" TIMESTAMPTZ NOT NULL,
      "createdBy" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "acceptedAt" TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_invite_token ON "Invite"(token)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_invite_email ON "Invite"(email)`;
  console.log('  ✅ Invite');

  await sql`
    CREATE TABLE "Patient" (
      id SERIAL PRIMARY KEY,
      "fullName" TEXT NOT NULL,
      "dateOfBirth" TEXT,
      gender TEXT,
      "civilStatus" TEXT,
      "nationalId" TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      "emergencyContactName" TEXT,
      "emergencyContactPhone" TEXT,
      "emergencyContactRelationship" TEXT,
      "insuranceProvider" TEXT,
      "insurancePolicyNumber" TEXT,
      "hmoAccount" TEXT,
      "referredBy" TEXT,
      "firstVisitDate" TEXT,
      "preferredCommunication" TEXT,
      "bloodType" TEXT,
      allergies TEXT,
      "currentMedications" TEXT,
      "medicalHistory" TEXT,
      "surgicalHistory" TEXT,
      "familyHistory" TEXT,
      "smokingAlcoholUse" TEXT,
      height DOUBLE PRECISION,
      weight DOUBLE PRECISION,
      "vaccinationStatus" TEXT,
      "profileImage" TEXT,
      attachments TEXT,
      "specialtyData" TEXT,
      "clinicId" INTEGER NOT NULL REFERENCES "Clinic"(id) ON DELETE CASCADE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_patient_clinicid ON "Patient"("clinicId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_patient_phone ON "Patient"(phone)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_patient_fullname ON "Patient"("fullName")`;
  console.log('  ✅ Patient');

  await sql`
    CREATE TABLE "Plan" (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      "priceMonthly" INTEGER NOT NULL,
      "priceYearly" INTEGER NOT NULL,
      "maxDoctors" INTEGER,
      "maxStaff" INTEGER,
      "multiClinic" BOOLEAN DEFAULT false,
      features TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Plan');

  await sql`
    CREATE TABLE "Subscription" (
      id SERIAL PRIMARY KEY,
      "clinicId" INTEGER UNIQUE NOT NULL REFERENCES "Clinic"(id) ON DELETE CASCADE,
      "planId" INTEGER NOT NULL REFERENCES "Plan"(id),
      status TEXT NOT NULL,
      "trialEndsAt" TIMESTAMPTZ,
      "startsAt" TIMESTAMPTZ DEFAULT NOW(),
      "endsAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_subscription_clinicid ON "Subscription"("clinicId")`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subscription_status ON "Subscription"(status)`;
  console.log('  ✅ Subscription');

  console.log('\n✅ All tables created!\n');

  // Seed roles
  console.log('Seeding roles...');
  await sql`INSERT INTO "Role" (id, name) VALUES (1, 'DOCTOR') ON CONFLICT (name) DO NOTHING`;
  await sql`INSERT INTO "Role" (id, name) VALUES (2, 'RECEPTIONIST') ON CONFLICT (name) DO NOTHING`;
  await sql`INSERT INTO "Role" (id, name) VALUES (3, 'ADMIN') ON CONFLICT (name) DO NOTHING`;
  await sql`INSERT INTO "Role" (id, name) VALUES (4, 'SUPER_ADMIN') ON CONFLICT (name) DO NOTHING`;
  await sql`SELECT setval('"Role_id_seq"', 5, false)`;
  console.log('  ✅ Roles seeded');

  // Seed plans
  console.log('Seeding plans...');
  await sql`
    INSERT INTO "Plan" (name, "priceMonthly", "priceYearly", "maxDoctors", "maxStaff", "multiClinic", features)
    VALUES 
      ('STARTER', 0, 0, 1, 2, false, '["basic_appointments","basic_prescriptions","basic_invoicing"]'),
      ('GROWTH', 2900, 29000, 3, 10, false, '["basic_appointments","basic_prescriptions","basic_invoicing","patient_history","reports"]'),
      ('PRO', 7900, 79000, NULL, NULL, true, '["basic_appointments","basic_prescriptions","basic_invoicing","patient_history","reports","multi_clinic","api_access","priority_support"]')
    ON CONFLICT (name) DO NOTHING
  `;
  console.log('  ✅ Plans seeded');

  // Re-import existing data from sqlite-export.json
  if (existsSync('./sqlite-export.json')) {
    console.log('\nImporting existing data from sqlite-export.json...');
    const exportData = JSON.parse(readFileSync('./sqlite-export.json', 'utf-8'));

    // Import Clinics
    if (exportData.Clinic?.length > 0) {
      for (const clinic of exportData.Clinic) {
        await sql`
          INSERT INTO "Clinic" (id, name, address, phone, email, "createdAt")
          VALUES (${clinic.id}, ${clinic.name}, ${clinic.address || null}, 
                  ${clinic.phone || null}, ${clinic.email || null}, 
                  ${clinic.createdAt || new Date().toISOString()})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      const maxClinic = Math.max(...exportData.Clinic.map(c => c.id));
      await sql`SELECT setval('"Clinic_id_seq"', ${maxClinic + 1}, false)`;
      console.log(`  ✅ ${exportData.Clinic.length} Clinic(s) imported`);
    }

    // Import Users
    if (exportData.User?.length > 0) {
      for (const user of exportData.User) {
        await sql`
          INSERT INTO "User" (id, email, password, "fullName", "profileImage", 
                              "emailVerified", "verificationToken", "verificationExpires",
                              "createdAt", "lastLogin")
          VALUES (${user.id}, ${user.email}, ${user.password}, ${user.fullName},
                  ${user.profileImage || null}, ${Boolean(user.emailVerified)},
                  ${user.verificationToken || null}, ${user.verificationExpires || null},
                  ${user.createdAt || new Date().toISOString()}, 
                  ${user.lastLogin || null})
          ON CONFLICT (email) DO NOTHING
        `;
      }
      const maxUser = Math.max(...exportData.User.map(u => u.id));
      await sql`SELECT setval('"User_id_seq"', ${maxUser + 1}, false)`;
      console.log(`  ✅ ${exportData.User.length} User(s) imported`);
    }

    // Import ClinicUsers
    if (exportData.ClinicUser?.length > 0) {
      for (const cu of exportData.ClinicUser) {
        await sql`
          INSERT INTO "ClinicUser" (id, "clinicId", "userId", "roleId", "createdAt")
          VALUES (${cu.id}, ${cu.clinicId}, ${cu.userId}, ${cu.roleId}, 
                  ${cu.createdAt || new Date().toISOString()})
          ON CONFLICT ("userId", "clinicId", "roleId") DO NOTHING
        `;
      }
      const maxCU = Math.max(...exportData.ClinicUser.map(c => c.id));
      await sql`SELECT setval('"ClinicUser_id_seq"', ${maxCU + 1}, false)`;
      console.log(`  ✅ ${exportData.ClinicUser.length} ClinicUser(s) imported`);
    }
  }

  console.log('\n🎉 Database setup complete!');
  
  // Verify
  const tables = await sql`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `;
  console.log('\nTables in database:');
  tables.forEach(t => console.log(`  - ${t.tablename}`));

  const userCount = await sql`SELECT COUNT(*) as count FROM "User"`;
  const roleCount = await sql`SELECT COUNT(*) as count FROM "Role"`;
  const clinicCount = await sql`SELECT COUNT(*) as count FROM "Clinic"`;
  console.log(`\nData: ${userCount[0].count} users, ${roleCount[0].count} roles, ${clinicCount[0].count} clinics`);
}

setupDatabase().catch(console.error);

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = 'postgresql://neondb_owner:npg_89pjVAZBzQkn@ep-dark-wildflower-a1sr8phq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

async function createTables() {
  try {
    console.log('Creating tables in Neon database...');
    
    // User table
    await sql`
      CREATE TABLE IF NOT EXISTS "User" (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        "fullName" TEXT NOT NULL,
        "profileImage" TEXT,
        "emailVerified" BOOLEAN DEFAULT false,
        "verificationToken" TEXT,
        "verificationExpires" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "lastLogin" TIMESTAMP
      )
    `;
    console.log('✅ Created User table');

    // DoctorProfile table
    await sql`
      CREATE TABLE IF NOT EXISTS "DoctorProfile" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL,
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
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created DoctorProfile table');

    // ReceptionistProfile table
    await sql`
      CREATE TABLE IF NOT EXISTS "ReceptionistProfile" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL,
        phone TEXT,
        address TEXT,
        "hireDate" TIMESTAMP,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created ReceptionistProfile table');

    // Clinic table
    await sql`
      CREATE TABLE IF NOT EXISTS "Clinic" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        email TEXT,
        logo TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created Clinic table');

    // Role table
    await sql`
      CREATE TABLE IF NOT EXISTS "Role" (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created Role table');

    // ClinicUser table
    await sql`
      CREATE TABLE IF NOT EXISTS "ClinicUser" (
        id SERIAL PRIMARY KEY,
        "clinicId" INTEGER NOT NULL,
        "userId" INTEGER NOT NULL,
        "roleId" INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"(id) ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
        FOREIGN KEY ("roleId") REFERENCES "Role"(id) ON DELETE CASCADE,
        UNIQUE ("clinicId", "userId")
      )
    `;
    console.log('✅ Created ClinicUser table');

    // Patient table
    await sql`
      CREATE TABLE IF NOT EXISTS "Patient" (
        id SERIAL PRIMARY KEY,
        "clinicId" INTEGER NOT NULL,
        "fullName" TEXT NOT NULL,
        "dateOfBirth" TIMESTAMP,
        gender TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        "profileImage" TEXT,
        "emergencyContact" TEXT,
        "emergencyPhone" TEXT,
        "bloodType" TEXT,
        allergies TEXT,
        "medicalHistory" TEXT,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created Patient table');

    // PatientImage table
    await sql`
      CREATE TABLE IF NOT EXISTS "PatientImage" (
        id SERIAL PRIMARY KEY,
        "patientId" INTEGER NOT NULL,
        "imageUrl" TEXT NOT NULL,
        caption TEXT,
        "uploadedBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("patientId") REFERENCES "Patient"(id) ON DELETE CASCADE,
        FOREIGN KEY ("uploadedBy") REFERENCES "User"(id) ON DELETE SET NULL
      )
    `;
    console.log('✅ Created PatientImage table');

    // PatientAttachment table
    await sql`
      CREATE TABLE IF NOT EXISTS "PatientAttachment" (
        id SERIAL PRIMARY KEY,
        "patientId" INTEGER NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "fileType" TEXT,
        description TEXT,
        "uploadedBy" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("patientId") REFERENCES "Patient"(id) ON DELETE CASCADE,
        FOREIGN KEY ("uploadedBy") REFERENCES "User"(id) ON DELETE SET NULL
      )
    `;
    console.log('✅ Created PatientAttachment table');

    // Appointment table
    await sql`
      CREATE TABLE IF NOT EXISTS "Appointment" (
        id SERIAL PRIMARY KEY,
        "clinicId" INTEGER NOT NULL,
        "patientId" INTEGER NOT NULL,
        "doctorId" INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        date TIMESTAMP NOT NULL,
        duration INTEGER,
        status TEXT DEFAULT 'scheduled',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"(id) ON DELETE CASCADE,
        FOREIGN KEY ("patientId") REFERENCES "Patient"(id) ON DELETE CASCADE,
        FOREIGN KEY ("doctorId") REFERENCES "User"(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created Appointment table');

    // Prescription table
    await sql`
      CREATE TABLE IF NOT EXISTS "Prescription" (
        id SERIAL PRIMARY KEY,
        "clinicId" INTEGER NOT NULL,
        "patientId" INTEGER NOT NULL,
        "doctorId" INTEGER NOT NULL,
        "appointmentId" INTEGER,
        diagnosis TEXT,
        medications TEXT NOT NULL,
        instructions TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"(id) ON DELETE CASCADE,
        FOREIGN KEY ("patientId") REFERENCES "Patient"(id) ON DELETE CASCADE,
        FOREIGN KEY ("doctorId") REFERENCES "User"(id) ON DELETE CASCADE,
        FOREIGN KEY ("appointmentId") REFERENCES "Appointment"(id) ON DELETE SET NULL
      )
    `;
    console.log('✅ Created Prescription table');

    // Medicine table
    await sql`
      CREATE TABLE IF NOT EXISTS "Medicine" (
        id SERIAL PRIMARY KEY,
        "clinicId" INTEGER NOT NULL,
        name TEXT NOT NULL,
        "genericName" TEXT,
        dosage TEXT,
        form TEXT,
        manufacturer TEXT,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created Medicine table');

    // Invite table
    await sql`
      CREATE TABLE IF NOT EXISTS "Invite" (
        id SERIAL PRIMARY KEY,
        "clinicId" INTEGER NOT NULL,
        email TEXT NOT NULL,
        "roleId" INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending',
        "expiresAt" TIMESTAMP NOT NULL,
        "createdBy" INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"(id) ON DELETE CASCADE,
        FOREIGN KEY ("roleId") REFERENCES "Role"(id) ON DELETE CASCADE,
        FOREIGN KEY ("createdBy") REFERENCES "User"(id) ON DELETE CASCADE
      )
    `;
    console.log('✅ Created Invite table');

    // Subscription plan table
    await sql`
      CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        "displayName" TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        interval TEXT NOT NULL,
        features TEXT,
        "maxDoctors" INTEGER,
        "maxReceptionists" INTEGER,
        "maxPatients" INTEGER,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created SubscriptionPlan table');

    // Subscription table
    await sql`
      CREATE TABLE IF NOT EXISTS "Subscription" (
        id SERIAL PRIMARY KEY,
        "clinicId" INTEGER UNIQUE NOT NULL,
        "planId" INTEGER NOT NULL,
        status TEXT NOT NULL,
        "currentPeriodStart" TIMESTAMP NOT NULL,
        "currentPeriodEnd" TIMESTAMP NOT NULL,
        "cancelAtPeriodEnd" BOOLEAN DEFAULT false,
        "stripeSubscriptionId" TEXT,
        "stripeCustomerId" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("clinicId") REFERENCES "Clinic"(id) ON DELETE CASCADE,
        FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"(id) ON DELETE RESTRICT
      )
    `;
    console.log('✅ Created Subscription table');

    console.log('\n🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:');
    console.error(error.message);
    console.error(error);
  }
}

createTables();

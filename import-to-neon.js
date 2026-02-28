import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { readFileSync } from 'fs';

// Configure WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = 'postgresql://neondb_owner:npg_89pjVAZBzQkn@ep-dark-wildflower-a1sr8phq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

// Load exported data
const exportData = JSON.parse(readFileSync('./sqlite-export.json', 'utf-8'));

async function importData() {
  try {
    console.log('Starting data import to Neon database...\n');

    // Import Roles first (referenced by other tables)  
    if (exportData.Role && exportData.Role.length > 0) {
      console.log(`Importing ${exportData.Role.length} Roles...`);
      for (const role of exportData.Role) {
        await sql`
          INSERT INTO "Role" (id, name, description, "createdAt")
          VALUES (${role.id}, ${role.name}, ${role.description || null}, 
                  ${role.createdAt || new Date().toISOString()})
          ON CONFLICT (name) DO NOTHING
        `;
      }
      console.log('✅ Roles imported');
    }

    // Import Clinics
    if (exportData.Clinic && exportData.Clinic.length > 0) {
      console.log(`Importing ${exportData.Clinic.length} Clinics...`);
      for (const clinic of exportData.Clinic) {
        await sql`
          INSERT INTO "Clinic" (id, name, address, phone, email, logo, "createdAt", "updatedAt")
          VALUES (${clinic.id}, ${clinic.name}, ${clinic.address || null}, 
                  ${clinic.phone || null}, ${clinic.email || null}, 
                  ${clinic.logo || null}, ${clinic.createdAt || new Date().toISOString()},
                  ${clinic.updatedAt || new Date().toISOString()})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log('✅ Clinics imported');
    }

    // Import Users
    if (exportData.User && exportData.User.length > 0) {
      console.log(`Importing ${exportData.User.length} Users...`);
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
      console.log('✅ Users imported');
    }

    // Import ClinicUsers (junction table)
    if (exportData.ClinicUser && exportData.ClinicUser.length > 0) {
      console.log(`Importing ${exportData.ClinicUser.length} ClinicUsers...`);
      for (const cu of exportData.ClinicUser) {
        await sql`
          INSERT INTO "ClinicUser" (id, "clinicId", "userId", "roleId", "createdAt")
          VALUES (${cu.id}, ${cu.clinicId}, ${cu.userId}, ${cu.roleId}, 
                  ${cu.createdAt || new Date().toISOString()})
          ON CONFLICT ("clinicId", "userId") DO NOTHING
        `;
      }
      console.log('✅ ClinicUsers imported');
    }

    // Import Patients
    if (exportData.Patient && exportData.Patient.length > 0) {
      console.log(`Importing ${exportData.Patient.length} Patients...`);
      for (const patient of exportData.Patient) {
        await sql`
          INSERT INTO "Patient" (id, "clinicId", "fullName", "dateOfBirth", gender,
                                 email, phone, address, "profileImage", "emergencyContact",
                                 "emergencyPhone", "bloodType", allergies, "medicalHistory",
                                 notes, "createdAt", "updatedAt")
          VALUES (${patient.id}, ${patient.clinicId}, ${patient.fullName},
                  ${patient.dateOfBirth || null}, ${patient.gender || null},
                  ${patient.email || null}, ${patient.phone || null},
                  ${patient.address || null}, ${patient.profileImage || null},
                  ${patient.emergencyContact || null}, ${patient.emergencyPhone || null},
                  ${patient.bloodType || null}, ${patient.allergies || null},
                  ${patient.medicalHistory || null}, ${patient.notes || null},
                  ${patient.createdAt || new Date().toISOString()},
                  ${patient.updatedAt || new Date().toISOString()})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      console.log('✅ Patients imported');
    }

    // Import DoctorProfiles
    if (exportData.DoctorProfile && exportData.DoctorProfile.length > 0) {
      console.log(`Importing ${exportData.DoctorProfile.length} DoctorProfiles...`);
      for (const dp of exportData.DoctorProfile) {
        await sql`
          INSERT INTO "DoctorProfile" (id, "userId", specialization, subspecialty, 
                                       "licenseNumber", "prcId", bio, "consultationFee",
                                       "clinicHours", "digitalSignature", "ptrTaxId",
                                       "ePrescriptionId", education, experience,
                                       "createdAt", "updatedAt")
          VALUES (${dp.id}, ${dp.userId}, ${dp.specialization || null},
                  ${dp.subspecialty || null}, ${dp.licenseNumber || null},
                  ${dp.prcId || null}, ${dp.bio || null}, ${dp.consultationFee || null},
                  ${dp.clinicHours || null}, ${dp.digitalSignature || null},
                  ${dp.ptrTaxId || null}, ${dp.ePrescriptionId || null},
                  ${dp.education || null}, ${dp.experience || null},
                  ${dp.createdAt || new Date().toISOString()},
                  ${dp.updatedAt || new Date().toISOString()})
          ON CONFLICT ("userId") DO NOTHING
        `;
      }
      console.log('✅ DoctorProfiles imported');
    }

    // Reset sequences to continue from max ID
    console.log('\nResetting sequence counters...');
    
    const tables = ['User', 'Clinic', 'Role', 'ClinicUser', 'Patient', 'DoctorProfile'];
    for (const table of tables) {
      try {
        const result = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM ${sql(table)}`;
        const nextId = result[0].next_id;
        await sql`SELECT setval(pg_get_serial_sequence('${sql(table)}', 'id'), ${nextId}, false)`;
        console.log(`✅ ${table} sequence reset to ${nextId}`);
      } catch (error) {
        console.log(`⚠️  Could not reset sequence for ${table}: ${error.message}`);
      }
    }

    console.log('\n🎉 Data import complete!');
    console.log('\nImported:');
    console.log(`  - ${exportData.Role?.length || 0} Roles`);
    console.log(`  - ${exportData.Clinic?.length || 0} Clinics`);
    console.log(`  - ${exportData.User?.length || 0} Users`);
    console.log(`  - ${exportData.ClinicUser?.length || 0} ClinicUsers`);
    console.log(`  - ${exportData.Patient?.length || 0} Patients`);
    console.log(`  - ${exportData.DoctorProfile?.length || 0} DoctorProfiles`);

  } catch (error) {
    console.error('❌ Error importing data:');
    console.error(error.message);
    console.error(error);
  }
}

importData();

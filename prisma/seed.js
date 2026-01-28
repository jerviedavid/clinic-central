import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create default roles
    console.log('Creating roles...');
    const doctorRole = await prisma.role.upsert({
        where: { name: 'DOCTOR' },
        update: {},
        create: { name: 'DOCTOR' },
    });

    const receptionistRole = await prisma.role.upsert({
        where: { name: 'RECEPTIONIST' },
        update: {},
        create: { name: 'RECEPTIONIST' },
    });

    const adminRole = await prisma.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN' },
    });

    console.log('✅ Roles created:', { doctorRole, receptionistRole, adminRole });

    // Migration: Handle existing users from old schema
    // Note: This will run after migration, when old 'role' field no longer exists
    // For now, we'll just ensure roles exist

    console.log('✅ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

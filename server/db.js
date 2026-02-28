import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaNeonHttp } from '@prisma/adapter-neon';

// Create Neon HTTP connection (works reliably from all environments)
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_89pjVAZBzQkn@ep-dark-wildflower-a1sr8phq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

// Create Prisma adapter for Neon HTTP (pass connection string directly)
const adapter = new PrismaNeonHttp(connectionString);

// Initialize Prisma Client with Neon adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

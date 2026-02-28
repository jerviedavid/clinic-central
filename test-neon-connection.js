import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_89pjVAZBzQkn@ep-dark-wildflower-a1sr8phq-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function testConnection() {
  try {
    console.log('Attempting to connect to Neon database with Neon driver...');
    const sql = neon(connectionString);
    
    const result = await sql`SELECT version()`;
    console.log('✅ Successfully connected to Neon database!');
    console.log('Database version:', result[0].version);
    
    // Test a simple query
    const time = await sql`SELECT NOW() as current_time`;
    console.log('Current time:', time[0].current_time);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error.message);
    console.error('Error details:', error);
  }
}

testConnection();

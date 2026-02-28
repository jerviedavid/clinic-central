import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'prisma', 'dev.db');

const db = new Database(dbPath);

const exportData = {};

// Get all table names
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  AND name NOT LIKE 'sqlite_%'
  AND name NOT LIKE '_prisma_%'
`).all();

console.log('Found tables:', tables.map(t => t.name).join(', '));

// Export data from each table
for (const table of tables) {
  const tableName = table.name;
  try {
    const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
    exportData[tableName] = rows;
    console.log(`✅ Exported ${rows.length} rows from ${tableName}`);
  } catch (error) {
    console.error(`❌ Error exporting ${tableName}:`, error.message);
  }
}

// Save to JSON file
const outputPath = join(__dirname, 'sqlite-export.json');
writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

console.log(`\n🎉 Export complete! Data saved to: ${outputPath}`);
console.log(`\nSummary:`);
for (const [tableName, rows] of Object.entries(exportData)) {
  console.log(`  ${tableName}: ${rows.length} rows`);
}

db.close();

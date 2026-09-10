import { db, DB_PATH, initializeDatabase } from './schema';

function inspectDatabase() {
  initializeDatabase();

  console.log(`=======================================================`);
  console.log(`🔍 CAMPUSFIND DATABASE INSPECTION`);
  console.log(`📂 DB Location: ${DB_PATH}`);
  console.log(`=======================================================`);

  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all() as any[];

  console.log(`Found ${tables.length} Table(s):\n`);

  for (const t of tables) {
    const tableName = t.name;
    const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;
    console.log(`  📊 Table: ${tableName.padEnd(20)} | Rows: ${countResult.count}`);
  }

  console.log(`\n=======================================================`);
  console.log(`📋 RECENT LOST ITEMS (lost_items table)`);
  console.log(`=======================================================`);
  const lostItems = db.prepare(`SELECT * FROM lost_items ORDER BY createdAt DESC LIMIT 10`).all();
  console.dir(lostItems, { depth: null, colors: true });

  console.log(`\n=======================================================`);
  console.log(`📋 RECENT FOUND ITEMS (found_items table)`);
  console.log(`=======================================================`);
  const foundItems = db.prepare(`SELECT * FROM found_items ORDER BY createdAt DESC LIMIT 10`).all();
  console.dir(foundItems, { depth: null, colors: true });

  console.log(`=======================================================`);
}

inspectDatabase();

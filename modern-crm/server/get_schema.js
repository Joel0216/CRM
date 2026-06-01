import pool from './db.js';
import fs from 'fs/promises';

async function getSchema() {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const schema = {};

    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [columns] = await pool.query(`DESCRIBE ${tableName}`);
      schema[tableName] = columns;
    }

    await fs.writeFile('schema.json', JSON.stringify(schema, null, 2));
    console.log('Schema saved to schema.json');
    process.exit(0);
  } catch (error) {
    console.error('Error getting schema:', error);
    process.exit(1);
  }
}

getSchema();

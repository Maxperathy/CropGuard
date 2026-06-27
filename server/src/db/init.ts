import fs from 'fs';
import path from 'path';
import '../config/env';
import { pool } from './pool';

async function init() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);
  console.log('Database schema initialized successfully.');
  await pool.end();
}

init().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

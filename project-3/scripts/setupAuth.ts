import pool from '../lib/db';

async function setupAuthTable() {
  const client = await pool.connect();
  try {
    console.log('Creating app_users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'employee'
      );
    `);
    console.log('app_users table created or already exists.');
  } catch (err) {
    console.error('Error creating app_users table:', err);
  } finally {
    client.release();
    process.exit();
  }
}

setupAuthTable();

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in ../.env');
  process.exit(1);
}

const seedSql = `
WITH s AS (
  INSERT INTO shops (name, location, is_online, subscription_tier)
  VALUES ('Demo Shop', 'Campus Center', true, 'pro')
  RETURNING id
), op AS (
  INSERT INTO operators (shop_id, email, two_factor_enabled)
  SELECT id, 'operator@demoshop.local', false FROM s
  RETURNING id
), stu AS (
  INSERT INTO students (name, email, is_pro)
  VALUES ('Test Student', 'student@example.com', false)
  RETURNING id
), job AS (
  INSERT INTO jobs (shop_id, pin_hash, student_name, file_path, page_count, color, double_sided, copies, price_cfa, status)
  SELECT s.id, 'pin_hash_example', 'Test Student', '/uploads/test.pdf', 5, false, false, 1, 125, 'pending' FROM s
  RETURNING id
)
SELECT s.id AS shop_id, (SELECT id FROM op) AS operator_id, (SELECT id FROM stu) AS student_id, (SELECT id FROM job) AS job_id FROM s;
`;

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to DB, running seed...');
    const res = await client.query(seedSql);
    console.log('Seed completed:', res.rows[0]);
  } catch (err) {
    console.error('Seeding failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

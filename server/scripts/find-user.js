const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const email = process.argv[2];
if (!email) {
  console.error('Usage: node find-user.js <email>');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in ../.env');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const authRes = await client.query('SELECT id, email, created_at, raw_user_meta_data FROM auth.users WHERE email = $1', [email]);
    console.log('auth.users result:');
    console.table(authRes.rows);

    const opRes = await client.query('SELECT id, email, shop_id, created_at FROM operators WHERE email = $1', [email]);
    console.log('\noperators result:');
    console.table(opRes.rows);
  } catch (err) {
    console.error('Query failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in ../.env');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Operators:');
    const opRes = await client.query('SELECT id, email, shop_id, created_at FROM operators ORDER BY created_at DESC LIMIT 50');
    console.table(opRes.rows || []);

    console.log('\nRecent auth.users (from auth schema):');
    try {
      const authRes = await client.query('SELECT id, email, created_at, raw_user_meta_data FROM auth.users ORDER BY created_at DESC LIMIT 50');
      console.table(authRes.rows || []);
    } catch (e) {
      console.warn('Could not query auth.users (insufficient permissions or different schema):', e.message || e);
    }
  } catch (err) {
    console.error('Query failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

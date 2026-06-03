const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' }); // Load from root

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ Supabase URL or Service Role Key missing in .env');
}

const supabase = createClient(supabaseUrl || 'https://mock.supabase.co', supabaseServiceKey || 'mock-key');

module.exports = supabase;

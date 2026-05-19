const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_ANON_KEY) {
  console.error('\n❌ CRITICAL ERROR: Supabase Environment Variables are missing!');
  console.error('If you are deploying to Render, you MUST add the following variables in the Render Dashboard (Environment tab):');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_ANON_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('- SUPABASE_JWT_SECRET\n');
  process.exit(1);
}

// Service role client — bypasses RLS (for admin/backend operations)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { 
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws }
  }
);

// Anon client — respects RLS (for user-facing operations)
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    realtime: { transport: ws }
  }
);

module.exports = { supabaseAdmin, supabasePublic };

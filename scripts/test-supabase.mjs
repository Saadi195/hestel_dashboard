/**
 * Supabase Connection & Data Flow Test Script
 * Run: node scripts/test-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Load env vars from .env.local ─────────────────────────────────────────────
let SUPABASE_URL = '';
let SUPABASE_ANON_KEY = '';
let SUPABASE_SERVICE_KEY = '';

try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.split('=');
    const val = vals.join('=').trim();
    if (key?.trim() === 'NEXT_PUBLIC_SUPABASE_URL') SUPABASE_URL = val;
    if (key?.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') SUPABASE_ANON_KEY = val;
    if (key?.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SUPABASE_SERVICE_KEY = val;
  }
} catch (e) {
  console.error('❌ Could not read .env.local:', e.message);
}

const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => console.log(`  ❌ ${msg}`);
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const sep  = ()     => console.log('─'.repeat(60));

// ── Config Summary ─────────────────────────────────────────────────────────────
console.log('\n🔍  SUPABASE CONNECTION & DATA FLOW TEST');
sep();
console.log('\n📋  CONFIGURATION');
info(`URL:              ${SUPABASE_URL || '(not set)'}`);
info(`Anon Key:         ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.slice(0, 20) + '...' : '(not set)'}`);
info(`Service Role Key: ${SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.slice(0, 20) + '...' : '(EMPTY — will fall back to anon key!)'}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  fail('Missing required Supabase credentials. Aborting.');
  process.exit(1);
}

// ── Test 1: Basic HTTP connectivity ────────────────────────────────────────────
sep();
console.log('\n🌐  TEST 1: HTTP Connectivity to Supabase');
try {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (resp.ok || resp.status === 200 || resp.status === 404) {
    pass(`HTTP connection established (status: ${resp.status})`);
  } else {
    fail(`Unexpected HTTP status: ${resp.status}`);
  }
} catch (e) {
  fail(`HTTP connection failed: ${e.message}`);
}

// ── Create clients ─────────────────────────────────────────────────────────────
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

// ── Test 2: Auth system ─────────────────────────────────────────────────────────
sep();
console.log('\n🔐  TEST 2: Auth System');
try {
  const { data, error } = await anonClient.auth.getSession();
  if (error) {
    fail(`Auth error: ${error.message}`);
  } else {
    pass(`Auth system reachable — session: ${data.session ? 'active' : 'none (not logged in)'}`);
  }
} catch (e) {
  fail(`Auth system unreachable: ${e.message}`);
}

// ── Test 3: Table reads ─────────────────────────────────────────────────────────
sep();
console.log('\n📖  TEST 3: Table Read Access (anon key)');
const tablesToTest = ['residents', 'rooms', 'beds', 'fines', 'security_deposits', 'notices', 'rent_payments'];
const tableResults = {};

for (const table of tablesToTest) {
  try {
    const { data, error } = await anonClient.from(table).select('*').limit(3);
    if (error) {
      fail(`${table}: ${error.message} (code: ${error.code})`);
      tableResults[table] = { ok: false, count: 0, error: error.message };
    } else {
      pass(`${table}: ${data?.length ?? 0} row(s) returned`);
      tableResults[table] = { ok: true, count: data?.length ?? 0 };
    }
  } catch (e) {
    fail(`${table}: Exception — ${e.message}`);
    tableResults[table] = { ok: false, count: 0, error: e.message };
  }
}

// ── Test 4: Write test (residents table) ────────────────────────────────────────
sep();
console.log('\n✍️   TEST 4: Write / Insert Test (residents table)');
const testResidentId = '00000000-0000-0000-0000-788691554701';
const testPayload = {
  id: testResidentId,
  hostel_id: '00000000-0000-0000-0000-000000000001',
  full_name: '__CONNECTIVITY_TEST_DO_NOT_KEEP__',
  phone: '0000-0000000',
  status: 'RESERVED',
  created_by: '00000000-0000-0000-0000-000000000000',
};

let writeSuccess = false;
try {
  const { data, error } = await anonClient.from('residents').insert(testPayload).select('id').single();
  if (error) {
    fail(`INSERT failed: ${error.message} (code: ${error.code})`);
    if (error.code === '42501') info('RLS policy is blocking writes with anon key — this is expected & correct');
    if (error.code === '23505') info('Duplicate key — insert would work but UUID collision (test still passes)');
  } else {
    pass(`INSERT succeeded — id: ${data?.id}`);
    writeSuccess = true;

    // ── Test 5: Verify the row was saved ──────────────────────────────────────
    const { data: readBack, error: readErr } = await anonClient
      .from('residents')
      .select('id, full_name, status')
      .eq('id', testResidentId)
      .single();

    if (readErr) {
      fail(`READ-BACK after write failed: ${readErr.message}`);
    } else {
      pass(`READ-BACK confirmed — name: "${readBack.full_name}", status: "${readBack.status}"`);
    }

    // Cleanup test row
    const { error: delErr } = await anonClient.from('residents').delete().eq('id', testResidentId);
    if (!delErr) pass('Cleanup: test row deleted successfully');
  }
} catch (e) {
  fail(`INSERT exception: ${e.message}`);
}

// ── Test 5: Check hostels table / known seed rows ───────────────────────────────
sep();
console.log('\n🏠  TEST 5: Hostel Seed Data Check');
try {
  const { data, error } = await anonClient.from('hostels').select('id, name').limit(5);
  if (error) {
    fail(`hostels table: ${error.message}`);
    info('This table may not exist if schema migration was not applied');
  } else if (!data || data.length === 0) {
    fail('hostels table exists but has NO rows — seed data may not have been applied');
    info('Run your SQL migration/seed to populate the hostels table');
  } else {
    pass(`hostels table has ${data.length} row(s):`);
    for (const h of data) info(`  → ${h.id} | ${h.name}`);
  }
} catch (e) {
  fail(`hostels table check failed: ${e.message}`);
}

// ── Test 6: Resident count summary ──────────────────────────────────────────────
sep();
console.log('\n👥  TEST 6: Active Data Summary');
for (const [table, result] of Object.entries(tableResults)) {
  if (result.ok) {
    info(`${table}: ${result.count > 0 ? result.count + ' rows in DB' : 'table exists, 0 rows'}`);
  }
}

// ── Final Summary ───────────────────────────────────────────────────────────────
sep();
console.log('\n📊  FINAL SUMMARY');

const allTablesOk = Object.values(tableResults).every((r) => r.ok);
if (SUPABASE_URL && SUPABASE_ANON_KEY) pass('Supabase URL and anon key are configured');
if (!SUPABASE_SERVICE_KEY) fail('SUPABASE_SERVICE_ROLE_KEY is EMPTY — admin operations will use anon key (limited permissions)');
if (allTablesOk) {
  pass('All tested tables are reachable via Supabase');
} else {
  fail('Some tables are not accessible — check RLS policies or missing migrations');
}
if (writeSuccess) {
  pass('Write → Read-back round-trip verified successfully');
} else {
  info('Write test blocked by RLS (expected if anon writes are restricted) or failed — check Supabase RLS policies');
}

sep();
console.log('\n');

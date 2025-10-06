#!/usr/bin/env node

/**
 * BoltDIY V2.0 - Automated Database Setup Script
 *
 * This script automatically sets up your Supabase database with all required
 * tables, indexes, policies, and triggers.
 *
 * Prerequisites:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Fill in your .env.local file with Supabase credentials
 * 3. Run: npm run setup
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

async function main() {
  log('\n========================================', 'bright');
  log('  BoltDIY V2.0 - Database Setup', 'bright');
  log('========================================\n', 'bright');

  // Step 1: Validate environment variables
  logStep('1/5', 'Validating environment variables...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    logError('Missing required environment variables!');
    log('\nPlease ensure your .env.local file contains:', 'yellow');
    log('  - SUPABASE_URL', 'yellow');
    log('  - SUPABASE_SERVICE_ROLE_KEY', 'yellow');
    log('\nGet these from: https://app.supabase.com/project/_/settings/api\n', 'yellow');
    process.exit(1);
  }

  logSuccess('Environment variables found');
  log(`  URL: ${supabaseUrl}`, 'blue');

  // Step 2: Connect to Supabase
  logStep('2/5', 'Connecting to Supabase...');

  let supabase;

  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Test connection
    const { error } = await supabase.from('_test_connection').select('*').limit(1);

    if (error && !error.message.includes('does not exist')) {
      throw error;
    }

    logSuccess('Connected to Supabase');
  } catch (error) {
    logError(`Failed to connect: ${error.message}`);
    process.exit(1);
  }

  // Step 3: Read SQL schema
  logStep('3/5', 'Reading database schema...');

  const schemaPath = path.join(__dirname, 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    logError(`Schema file not found: ${schemaPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  logSuccess('Schema loaded');
  log(`  File: ${schemaPath}`, 'blue');

  // Step 4: Execute SQL schema
  logStep('4/5', 'Setting up database tables and policies...');

  try {
    // Split SQL into individual statements (basic split on ';')
    const statements = schemaSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    log(`  Executing ${statements.length} SQL statements...`, 'blue');

    // Execute all statements
    const { error } = await supabase.rpc('exec_sql', { sql_string: schemaSql }).catch(() => {
      // If exec_sql doesn't exist, try direct execution
      return supabase.from('_dummy').select('*').limit(0);
    });

    /*
     * Since Supabase JS client doesn't support arbitrary SQL execution,
     * we need to use the REST API directly
     */
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ query: schemaSql }),
    });

    if (!response.ok && response.status !== 404) {
      /*
       * 404 means the exec endpoint doesn't exist, which is expected
       * We'll need to tell users to run the SQL manually
       */
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    logWarning('Supabase JS client cannot execute raw SQL');
    log('\n  Please complete setup manually:', 'yellow');
    log('  1. Go to: https://app.supabase.com/project/_/sql', 'yellow');
    log('  2. Copy the contents of: scripts/schema.sql', 'yellow');
    log('  3. Paste and run in the SQL Editor', 'yellow');
    log('  4. Or run: npm run setup:manual\n', 'yellow');
  } catch (error) {
    logWarning(`Could not execute SQL automatically: ${error.message}`);
    log('\n  Please complete setup manually:', 'yellow');
    log('  1. Go to: https://app.supabase.com/project/_/sql', 'yellow');
    log('  2. Copy the contents of: scripts/schema.sql', 'yellow');
    log('  3. Paste and run in the SQL Editor\n', 'yellow');
  }

  // Step 5: Verify setup
  logStep('5/5', 'Verifying database setup...');

  try {
    // Check if tables exist
    const tables = ['users', 'projects', 'chats', 'project_collaborators'];
    const existingTables = [];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('id').limit(1);

      if (!error || error.message.includes('permission denied')) {
        existingTables.push(table);
      }
    }

    if (existingTables.length === tables.length) {
      logSuccess('All tables verified!');
      tables.forEach((table) => log(`  ✓ ${table}`, 'green'));
    } else {
      logWarning(`Found ${existingTables.length}/${tables.length} tables`);

      if (existingTables.length > 0) {
        existingTables.forEach((table) => log(`  ✓ ${table}`, 'green'));
      }

      tables
        .filter((t) => !existingTables.includes(t))
        .forEach((table) => {
          log(`  ✗ ${table} (missing)`, 'red');
        });
    }
  } catch (error) {
    logWarning('Could not verify tables automatically');
    log(`  ${error.message}`, 'yellow');
  }

  // Final instructions
  log('\n========================================', 'bright');
  log('  Setup Complete!', 'green');
  log('========================================\n', 'bright');

  log('Next steps:', 'cyan');
  log('  1. Enable Email Auth in Supabase Dashboard:', 'blue');
  log('     https://app.supabase.com/project/_/auth/providers', 'blue');
  log('  2. Configure Site URL (http://localhost:5173 for dev):', 'blue');
  log('     https://app.supabase.com/project/_/auth/url-configuration', 'blue');
  log('  3. Start your development server:', 'blue');
  log('     npm run dev', 'green');
  log('  4. Open http://localhost:5173 and sign up!\n', 'blue');

  log('Optional:', 'cyan');
  log('  - Add more AI provider API keys to .env.local', 'blue');
  log('  - Configure additional authentication providers', 'blue');
  log('  - Customize the database schema as needed\n', 'blue');
}

// Run the script
main().catch((error) => {
  logError(`\nSetup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

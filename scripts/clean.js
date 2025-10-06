#!/usr/bin/env node

/**
 * BoltDIY V2.0 - Comprehensive Cleanup Script
 * 
 * This script performs a complete cleanup and rebuild of the project:
 * - Removes all build artifacts and caches
 * - Clears Vite, Remix, and Wrangler caches
 * - Prunes pnpm store
 * - Reinstalls dependencies from scratch
 * - Rebuilds the project
 * - Verifies the build works
 * 
 * Run this when you encounter build issues or need a fresh start.
 */

import { rm, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rmAsync = promisify(rm);

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

// Comprehensive list of directories and files to clean
const dirsToRemove = [
  // Build outputs
  'dist',
  'build',
  '.remix',
  '.wrangler',
  
  // Cache directories
  'node_modules/.vite',
  'node_modules/.cache',
  '.cache',
  '.vite',
  '.temp',
  '.tmp',
  
  // Vite specific
  'node_modules/.vite-cache',
  '.vite-cache',
  
  // Remix specific
  '.remix/cache',
  'public/build',
  
  // Wrangler specific
  '.wrangler/state',
  '.wrangler/tmp',
  
  // Test artifacts
  'coverage',
  '.nyc_output',
  
  // ESLint cache
  '.eslintcache',
  
  // TypeScript cache
  '*.tsbuildinfo',
  'tsconfig.tsbuildinfo',
  
  // OS specific
  '.DS_Store',
  'Thumbs.db',
];

log('\n========================================', 'bright');
log('  BoltDIY V2.0 - Deep Clean', 'bright');
log('========================================\n', 'bright');

log('⚠️  This will remove all build artifacts, caches, and dependencies!', 'yellow');
log('   The project will be rebuilt from scratch.\n', 'yellow');

async function cleanDirectories() {
  log('[1/6] Removing build artifacts and cache directories...', 'cyan');
  
  let removedCount = 0;
  let skippedCount = 0;
  
  for (const dir of dirsToRemove) {
    const fullPath = join(__dirname, '..', dir);
    
    try {
      if (existsSync(fullPath)) {
        await rmAsync(fullPath, { recursive: true, force: true });
        log(`  ✓ Removed ${dir}`, 'green');
        removedCount++;
      } else {
        skippedCount++;
      }
    } catch (err) {
      log(`  ✗ Error removing ${dir}: ${err.message}`, 'red');
    }
  }
  
  log(`\n  Removed ${removedCount} items, skipped ${skippedCount} (not found)`, 'blue');
}

async function removeNodeModules() {
  log('\n[2/6] Removing node_modules...', 'cyan');
  
  const nodeModulesPath = join(__dirname, '..', 'node_modules');
  
  if (existsSync(nodeModulesPath)) {
    try {
      log('  This may take a minute...', 'yellow');
      await rmAsync(nodeModulesPath, { recursive: true, force: true });
      log('  ✓ Removed node_modules', 'green');
    } catch (err) {
      log(`  ✗ Error removing node_modules: ${err.message}`, 'red');
      throw err;
    }
  } else {
    log('  ⊘ node_modules not found (already clean)', 'blue');
  }
}

async function removeLockfile() {
  log('\n[3/6] Removing lockfile...', 'cyan');
  
  const lockfilePath = join(__dirname, '..', 'pnpm-lock.yaml');
  
  if (existsSync(lockfilePath)) {
    try {
      await rmAsync(lockfilePath, { force: true });
      log('  ✓ Removed pnpm-lock.yaml', 'green');
    } catch (err) {
      log(`  ✗ Error removing lockfile: ${err.message}`, 'red');
    }
  } else {
    log('  ⊘ pnpm-lock.yaml not found', 'blue');
  }
}

function runCommand(command, description, { silent = false, optional = false } = {}) {
  try {
    if (!silent) {
      log(`  ${description}...`, 'blue');
    }
    
    const output = execSync(command, {
      stdio: silent ? 'pipe' : 'inherit',
      cwd: join(__dirname, '..'),
      encoding: 'utf8',
    });
    
    if (!silent) {
      log(`  ✓ ${description} completed`, 'green');
    }
    
    return output;
  } catch (err) {
    if (optional) {
      log(`  ⊘ ${description} skipped (optional)`, 'yellow');
      return null;
    }
    log(`  ✗ Error during ${description}: ${err.message}`, 'red');
    throw err;
  }
}

async function prunePnpmStore() {
  log('\n[4/6] Pruning pnpm store...', 'cyan');
  
  try {
    runCommand('pnpm store prune', 'Pruning unreferenced packages');
    log('  ✓ pnpm store pruned', 'green');
  } catch (err) {
    log('  ⊘ Could not prune pnpm store (continuing anyway)', 'yellow');
  }
}

async function reinstallDependencies() {
  log('\n[5/6] Reinstalling dependencies...', 'cyan');
  log('  This will take a few minutes...', 'yellow');
  
  try {
    runCommand('pnpm install --frozen-lockfile=false', 'Installing fresh dependencies');
    log('\n  ✓ Dependencies installed successfully', 'green');
    
    // Show installed packages count
    try {
      const packageCount = execSync('find node_modules -maxdepth 1 -type d | wc -l', {
        cwd: join(__dirname, '..'),
        encoding: 'utf8',
      }).trim();
      log(`  📦 ${packageCount} packages installed`, 'blue');
    } catch (err) {
      // Ignore error
    }
  } catch (err) {
    log('\n  ✗ Failed to install dependencies', 'red');
    throw err;
  }
}

async function rebuildProject() {
  log('\n[6/6] Building and verifying project...', 'cyan');
  
  try {
    // Generate Wrangler types
    log('  Generating Wrangler types...', 'blue');
    runCommand('pnpm typegen', 'Type generation', { optional: true });
    
    // Run typecheck
    log('\n  Running type check...', 'blue');
    runCommand('pnpm typecheck', 'Type checking');
    
    // Build the project
    log('\n  Building project...', 'blue');
    runCommand('pnpm build', 'Building');
    
    log('\n  ✓ Build completed successfully', 'green');
    
    // Verify build output exists
    const buildPath = join(__dirname, '..', 'build');
    if (existsSync(buildPath)) {
      log('  ✓ Build artifacts created', 'green');
    } else {
      log('  ⚠️  Build directory not found (this might be normal)', 'yellow');
    }
    
  } catch (err) {
    log('\n  ✗ Build or verification failed', 'red');
    throw err;
  }
}

async function showSummary() {
  log('\n========================================', 'bright');
  log('  ✨ Cleanup Completed Successfully!', 'green');
  log('========================================\n', 'bright');
  
  log('🎉 Your project is now completely clean and rebuilt!', 'green');
  log('\n📋 What was done:', 'cyan');
  log('  ✓ Removed all build artifacts', 'green');
  log('  ✓ Cleared all caches (Vite, Remix, Wrangler)', 'green');
  log('  ✓ Removed node_modules', 'green');
  log('  ✓ Pruned pnpm store', 'green');
  log('  ✓ Reinstalled dependencies', 'green');
  log('  ✓ Rebuilt project', 'green');
  log('  ✓ Verified types and build', 'green');
  
  log('\n🚀 You can now run:', 'cyan');
  log('  • pnpm dev       - Start development server', 'blue');
  log('  • pnpm start     - Start production with Wrangler', 'blue');
  log('  • pnpm preview   - Build and preview locally', 'blue');
  log('  • pnpm deploy    - Deploy to Cloudflare Pages', 'blue');
  
  log('\n💡 If you still have issues:', 'cyan');
  log('  1. Make sure your .env.local is configured', 'blue');
  log('  2. Check that Supabase is set up', 'blue');
  log('  3. Verify your API keys are valid', 'blue');
  log('  4. Try running: pnpm setup (for database setup)\n', 'blue');
}

async function handleError(err) {
  log('\n========================================', 'bright');
  log('  💥 Cleanup Failed', 'red');
  log('========================================\n', 'bright');
  
  log('Error details:', 'red');
  log(`  ${err.message}\n`, 'red');
  
  log('🛠️  Manual recovery steps:', 'yellow');
  log('  1. Remove directories manually:', 'blue');
  log('     rm -rf node_modules dist build .remix .wrangler .cache', 'blue');
  log('  2. Clean pnpm:', 'blue');
  log('     pnpm store prune', 'blue');
  log('  3. Reinstall dependencies:', 'blue');
  log('     pnpm install', 'blue');
  log('  4. Rebuild:', 'blue');
  log('     pnpm build\n', 'blue');
  
  process.exit(1);
}

async function main() {
  const startTime = Date.now();
  
  try {
    // Step 1: Clean directories
    await cleanDirectories();
    
    // Step 2: Remove node_modules
    await removeNodeModules();
    
    // Step 3: Remove lockfile
    await removeLockfile();
    
    // Step 4: Prune pnpm store
    await prunePnpmStore();
    
    // Step 5: Reinstall dependencies
    await reinstallDependencies();
    
    // Step 6: Rebuild project
    await rebuildProject();
    
    // Show summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\n⏱️  Total time: ${duration}s\n`, 'cyan');
    
    await showSummary();
    
  } catch (err) {
    await handleError(err);
  }
}

// Run the script
main();

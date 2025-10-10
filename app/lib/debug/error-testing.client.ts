/**
 * Browser console testing utilities for error monitoring system
 *
 * Usage in browser console:
 * ```javascript
 * // Add a test error
 * window.testError()
 *
 * // Add a specific error type
 * window.testError('syntax')
 *
 * // Add multiple errors
 * window.testError('vite')
 * window.testError('typescript')
 *
 * // Clear all errors
 * window.clearErrors()
 *
 * // Get error statistics
 * window.errorStats()
 * ```
 */

import { errorStore } from '~/lib/stores/errors';
import type { DevServerError } from '~/types/errors';

const TEST_ERRORS: Record<string, Omit<DevServerError, 'id' | 'timestamp' | 'dismissed'>> = {
  syntax: {
    type: 'syntax',
    severity: 'error',
    message: "Unexpected token ';'. Expected '}' to close block.",
    file: '/home/project/src/App.tsx',
    line: 42,
    column: 15,
    source: 'typescript',
    stack: `  at parseSourceFile (typescript.js:1234)
  at createSourceFile (typescript.js:5678)
  at processFile (vite.js:9012)`,
  },

  vite: {
    type: 'build',
    severity: 'error',
    message: 'Failed to resolve import "./missing-module"',
    file: '/home/project/src/components/Button.tsx',
    line: 3,
    column: 24,
    source: 'vite',
  },

  react: {
    type: 'runtime',
    severity: 'error',
    message: 'Cannot read property "map" of undefined',
    file: '/home/project/src/pages/Dashboard.tsx',
    line: 28,
    column: 18,
    source: 'react',
    stack: `  at Dashboard (Dashboard.tsx:28:18)
  at renderWithHooks (react-dom.js:1234)
  at updateFunctionComponent (react-dom.js:5678)`,
  },

  typescript: {
    type: 'syntax',
    severity: 'error',
    message: "Type 'string' is not assignable to type 'number'",
    file: '/home/project/src/utils/helpers.ts',
    line: 15,
    column: 10,
    source: 'typescript',
  },

  module: {
    type: 'build',
    severity: 'error',
    message: "Cannot find module 'lodash' or its corresponding type declarations",
    file: '/home/project/src/services/api.ts',
    line: 5,
    column: 23,
    source: 'typescript',
  },

  warning: {
    type: 'warning',
    severity: 'warning',
    message: 'React Hook useEffect has a missing dependency',
    file: '/home/project/src/hooks/useData.ts',
    line: 20,
    source: 'eslint',
  },
};

/**
 * Add a test error to the error store
 */
export function addTestError(type: keyof typeof TEST_ERRORS = 'syntax') {
  const errorData = TEST_ERRORS[type];

  if (!errorData) {
    console.error(`Unknown error type: ${type}. Available types:`, Object.keys(TEST_ERRORS).join(', '));
    return;
  }

  errorStore.addError(errorData);
  console.log(`✅ Added test ${type} error`);
}

/**
 * Clear all errors
 */
export function clearAllErrors() {
  errorStore.clearErrors();
  console.log('✅ All errors cleared');
}

/**
 * Get error statistics
 */
export function getErrorStats() {
  const errors = Object.values(errorStore.errors.get());
  const activeErrors = errors.filter((e) => !e.dismissed);

  const stats = {
    total: errors.length,
    active: activeErrors.length,
    dismissed: errors.length - activeErrors.length,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
  };

  errors.forEach((error) => {
    stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    stats.bySource[error.source] = (stats.bySource[error.source] || 0) + 1;
  });

  console.table(stats);

  return stats;
}

/**
 * List all available test error types
 */
export function listErrorTypes() {
  console.log('Available error types:', Object.keys(TEST_ERRORS).join(', '));
  console.log('\nExamples:');
  console.log('  window.testError("syntax")');
  console.log('  window.testError("vite")');
  console.log('  window.testError("react")');
}

/**
 * Test error monitoring by simulating output
 */
export function testErrorPatterns() {
  const { parseError, containsError } = require('~/lib/webcontainer/error-patterns');

  const testOutputs = [
    '[vite] Internal server error: Cannot find module',
    'Error: Unexpected token } in JSON at position 42',
    'src/App.tsx(15,10): error TS2322: Type "string" is not assignable to type "number"',
    'Module not found: Cannot resolve "./missing-file.js"',
    'warning: React Hook useEffect has a missing dependency',
  ];

  console.log('Testing error patterns:');
  console.table(
    testOutputs.map((output) => ({
      output: output.substring(0, 50) + '...',
      detected: containsError(output),
      parsed: parseError(output)?.message || 'N/A',
    })),
  );
}

// Export to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).testError = addTestError;
  (window as any).clearErrors = clearAllErrors;
  (window as any).errorStats = getErrorStats;
  (window as any).listErrorTypes = listErrorTypes;
  (window as any).testErrorPatterns = testErrorPatterns;

  console.log('🔍 Error testing utilities loaded! Try:');
  console.log('  window.testError()          - Add a test error');
  console.log('  window.listErrorTypes()     - List all error types');
  console.log('  window.errorStats()         - View error statistics');
  console.log('  window.clearErrors()        - Clear all errors');
  console.log('  window.testErrorPatterns()  - Test pattern matching');
}

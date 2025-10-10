import type { ErrorPattern } from '~/types/errors';

/**
 * Strip ANSI color codes from terminal output
 */
export function stripAnsiCodes(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

/**
 * Comprehensive error patterns for various dev servers and tools
 */
export const ERROR_PATTERNS: ErrorPattern[] = [
  // Vite errors
  {
    pattern: /\[vite\] (?:\x1b\[\d+m)?(?:Internal server )?error:?\s*(.+?)(?:\n|$)/i,
    type: 'runtime',
    source: 'vite',
    severity: 'error',
    parser: (match) => ({
      message: match[1]?.trim() || 'Vite internal error',
    }),
  },
  {
    pattern: /\[vite\]\s*(.+?)\s*\((\d+):(\d+)\)/,
    type: 'build',
    source: 'vite',
    severity: 'error',
    parser: (match) => ({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
    }),
  },

  // TypeScript errors
  {
    pattern: /(.+\.tsx?)\((\d+),(\d+)\):\s*error\s+TS(\d+):\s*(.+)/,
    type: 'syntax',
    source: 'typescript',
    severity: 'error',
    parser: (match) => ({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      message: `TS${match[4]}: ${match[5]}`,
    }),
  },
  {
    pattern: /(.+\.tsx?):\s*\((\d+),(\d+)\):\s*(.+)/,
    type: 'syntax',
    source: 'typescript',
    severity: 'error',
    parser: (match) => ({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      message: match[4],
    }),
  },

  // React/JSX errors
  {
    pattern: /Error:\s*(.+?)\s+at\s+(.+?):(\d+):(\d+)/,
    type: 'runtime',
    source: 'react',
    severity: 'error',
    parser: (match) => ({
      message: match[1],
      file: match[2],
      line: parseInt(match[3], 10),
      column: parseInt(match[4], 10),
    }),
  },
  {
    pattern: /Uncaught\s+(?:Error|TypeError|ReferenceError|SyntaxError):\s*(.+)/,
    type: 'runtime',
    source: 'react',
    severity: 'error',
    parser: (match) => ({
      message: match[1],
    }),
  },

  // ESLint warnings/errors
  {
    pattern: /(.+\.(?:js|jsx|ts|tsx))\s+(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(.+)/,
    type: 'syntax',
    source: 'eslint',
    severity: 'error',
    parser: (match) => ({
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      severity: match[4] === 'error' ? 'error' : 'warning',
      message: `${match[5]} (${match[6]})`,
    }),
  },

  // Webpack errors
  {
    pattern: /ERROR in\s+(.+?)(?:\n|$)/,
    type: 'build',
    source: 'webpack',
    severity: 'error',
    parser: (match) => ({
      message: match[1],
    }),
  },
  {
    pattern: /Module build failed.*?:\s*(.+)/,
    type: 'build',
    source: 'webpack',
    severity: 'error',
    parser: (match) => ({
      message: match[1],
    }),
  },

  // Next.js errors
  {
    pattern: /Error:\s*(.+?)\s+at\s+webpack/i,
    type: 'build',
    source: 'next',
    severity: 'error',
    parser: (match) => ({
      message: match[1],
    }),
  },

  // Generic syntax errors
  {
    pattern: /SyntaxError:\s*(.+)/,
    type: 'syntax',
    source: 'unknown',
    severity: 'error',
    parser: (match) => ({
      message: match[1],
    }),
  },

  // Module not found
  {
    pattern: /(?:Cannot find module|Module not found):\s*['"](.+?)['"]/,
    type: 'build',
    source: 'unknown',
    severity: 'error',
    parser: (match) => ({
      message: `Module not found: ${match[1]}`,
    }),
  },

  // Generic warnings
  {
    pattern: /warning:\s*(.+?)(?:\n|$)/i,
    type: 'warning',
    source: 'unknown',
    severity: 'warning',
    parser: (match) => ({
      message: match[1],
    }),
  },
];

/**
 * Parse error from output text
 */
export function parseError(output: string): Partial<import('~/types/errors').DevServerError> | null {
  // Strip ANSI color codes before parsing
  const cleanOutput = stripAnsiCodes(output);

  for (const errorPattern of ERROR_PATTERNS) {
    const match = cleanOutput.match(errorPattern.pattern);

    if (match) {
      return {
        type: errorPattern.type,
        source: errorPattern.source,
        severity: errorPattern.severity,
        ...errorPattern.parser(match),
      };
    }
  }

  return null;
}

/**
 * Check if output contains error indicators
 */
export function containsError(output: string): boolean {
  // Strip ANSI codes first
  const cleanOutput = stripAnsiCodes(output).toLowerCase();

  const errorKeywords = [
    'error:',
    'error ',
    'syntaxerror',
    'typeerror',
    'referenceerror',
    'failed',
    'cannot find',
    'module not found',
    'compilation failed',
    'build failed',
    'failed to compile',
    '✘ [error]',
    'x [error]',
  ];

  return errorKeywords.some((keyword) => cleanOutput.includes(keyword));
}

/**
 * Extract stack trace from error output
 */
export function extractStackTrace(output: string): string | undefined {
  // Strip ANSI codes first
  const cleanOutput = stripAnsiCodes(output);
  const lines = cleanOutput.split('\n');
  const stackLines: string[] = [];

  let inStack = false;

  for (const line of lines) {
    if (line.trim().startsWith('at ') || (line.includes('(') && line.includes(':'))) {
      inStack = true;
      stackLines.push(line);
    } else if (inStack && line.trim() === '') {
      break;
    }
  }

  return stackLines.length > 0 ? stackLines.join('\n') : undefined;
}

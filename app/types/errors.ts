/**
 * Represents a runtime error detected in the WebContainer dev server
 */
export interface DevServerError {
  id: string;
  timestamp: number;
  type: 'syntax' | 'runtime' | 'build' | 'warning' | 'unknown';
  severity: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
  source: 'vite' | 'webpack' | 'next' | 'react' | 'typescript' | 'eslint' | 'unknown';
  dismissed: boolean;
}

/**
 * Error pattern for matching and parsing errors from output
 */
export interface ErrorPattern {
  pattern: RegExp;
  type: DevServerError['type'];
  source: DevServerError['source'];
  severity: DevServerError['severity'];
  parser: (match: RegExpMatchArray) => Partial<DevServerError>;
}

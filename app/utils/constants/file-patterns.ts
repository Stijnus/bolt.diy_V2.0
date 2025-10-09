/**
 * Shared file filtering patterns and utilities for file operations
 * Used across file store, chat history persistence, and restoration
 */

/**
 * Files and directories to exclude from chat history restoration
 * and file operations
 */
export const EXCLUDED_FILE_PATTERNS: ReadonlyArray<RegExp> = [
  // Dependencies
  /\/node_modules\//,

  // Build outputs
  /\/\.next/,
  /\/\.astro/,
  /\/dist/,
  /\/build/,
  /\/out/,
  /\/\.output/,

  // Version control
  /\/\.git/,
  /\/\.svn/,
  /\/\.hg/,

  // IDE directories
  /\/\.vscode/,
  /\/\.idea/,
  /\/\.eclipse/,

  // Cache directories
  /\/\.cache/,
  /\/\.parcel-cache/,
  /\/\.turbo/,
  /\/\.nx/,

  // Test coverage
  /\/coverage/,
  /\/\.nyc_output/,

  // Environment files
  /\/\.env$/,
  /\/\.env\./,
  /\/\.env\.local/,
  /\/\.env\.development/,
  /\/\.env\.production/,

  // OS files
  /\/\.DS_Store/,
  /\/Thumbs\.db/,
  /\/desktop\.ini/,

  // Temporary files
  /\/\.tmp/,
  /\/tmp\//,
  /~$/,
  /\.swp$/,
  /\.swo$/,

  // Lock files (often large and auto-generated)
  /\/package-lock\.json$/,
  /\/yarn\.lock$/,
  /\/pnpm-lock\.yaml$/,
  /\/bun\.lockb$/,
];

/**
 * File extensions that are typically binary files
 */
export const BINARY_FILE_EXTENSIONS = [
  // Images
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.bmp',
  '.ico',
  '.webp',
  '.svg',

  // Videos
  '.mp4',
  '.webm',
  '.ogg',
  '.avi',
  '.mov',

  // Audio
  '.mp3',
  '.wav',
  '.flac',
  '.aac',

  // Archives
  '.zip',
  '.tar',
  '.gz',
  '.7z',
  '.rar',

  // Executables
  '.exe',
  '.dll',
  '.so',
  '.dylib',

  // Fonts
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',

  // Other
  '.pdf',
  '.wasm',
];

/**
 * File size limits for chat history persistence
 */
export const FILE_SIZE_LIMITS = {
  /** Maximum size for a single file (10 MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Maximum total size for all files in a chat (100 MB) */
  MAX_TOTAL_SIZE: 100 * 1024 * 1024,

  /** Soft warning threshold (80% of max total) */
  WARNING_THRESHOLD: 80 * 1024 * 1024,
} as const;

/**
 * Check if a file path should be excluded from chat history
 */
export function shouldExcludeFile(filePath: string): boolean {
  return EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Check if a file is likely binary based on extension
 */
export function isBinaryFileExtension(filePath: string): boolean {
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  return BINARY_FILE_EXTENSIONS.includes(ext);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Calculate the byte size of a string (UTF-8 encoding)
 */
export function getStringByteSize(str: string): number {
  // Use TextEncoder for accurate UTF-8 byte calculation
  return new TextEncoder().encode(str).length;
}

/**
 * Check if adding a file would exceed size limits
 */
export function wouldExceedSizeLimit(
  currentTotalSize: number,
  fileSize: number,
): { exceeded: boolean; reason?: string } {
  if (fileSize > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
    return {
      exceeded: true,
      reason: `File size ${formatBytes(fileSize)} exceeds maximum single file size of ${formatBytes(FILE_SIZE_LIMITS.MAX_FILE_SIZE)}`,
    };
  }

  if (currentTotalSize + fileSize > FILE_SIZE_LIMITS.MAX_TOTAL_SIZE) {
    return {
      exceeded: true,
      reason: `Total size would exceed maximum of ${formatBytes(FILE_SIZE_LIMITS.MAX_TOTAL_SIZE)}`,
    };
  }

  return { exceeded: false };
}

/**
 * Get file size statistics for a file map
 */
export function getFileSizeStats(fileMap: Record<string, { content: string; isBinary: boolean }>): {
  totalSize: number;
  fileCount: number;
  largestFile: { path: string; size: number } | null;
  warningLevel: 'none' | 'warning' | 'critical';
} {
  let totalSize = 0;
  let largestFile: { path: string; size: number } | null = null;

  const entries = Object.entries(fileMap);

  for (const [path, file] of entries) {
    const size = getStringByteSize(file.content);
    totalSize += size;

    if (!largestFile || size > largestFile.size) {
      largestFile = { path, size };
    }
  }

  let warningLevel: 'none' | 'warning' | 'critical' = 'none';
  if (totalSize >= FILE_SIZE_LIMITS.MAX_TOTAL_SIZE) {
    warningLevel = 'critical';
  } else if (totalSize >= FILE_SIZE_LIMITS.WARNING_THRESHOLD) {
    warningLevel = 'warning';
  }

  return {
    totalSize,
    fileCount: entries.length,
    largestFile,
    warningLevel,
  };
}

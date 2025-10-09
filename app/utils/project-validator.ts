/**
 * Project validation utility for validating file structure and content
 * during chat history restoration
 */

import type { FileMap } from '~/lib/stores/files';
import { createScopedLogger } from './logger';

const logger = createScopedLogger('ProjectValidator');

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  filePath?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  projectType?: ProjectType;
  hasPackageJson: boolean;
  hasTsConfig: boolean;
  totalFiles: number;
}

/**
 * Detected project types
 */
export type ProjectType =
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'nextjs'
  | 'remix'
  | 'astro'
  | 'node'
  | 'vite'
  | 'static'
  | 'unknown';

/**
 * Common configuration file patterns
 */
const CONFIG_FILES = {
  packageJson: /\/package\.json$/,
  tsconfig: /\/tsconfig.*\.json$/,
  viteConfig: /\/vite\.config\.(ts|js|mjs)$/,
  nextConfig: /\/next\.config\.(ts|js|mjs)$/,
  remixConfig: /\/remix\.config\.(ts|js)$/,
  astroConfig: /\/astro\.config\.(ts|js|mjs)$/,
  angularJson: /\/angular\.json$/,
  vueConfig: /\/vue\.config\.(ts|js)$/,
  svelteConfig: /\/svelte\.config\.(ts|js)$/,
} as const;

/**
 * Detect project type from file structure
 */
function detectProjectType(fileMap: FileMap): ProjectType {
  const paths = Object.keys(fileMap);

  // Check for Next.js
  if (paths.some((p) => CONFIG_FILES.nextConfig.test(p))) {
    return 'nextjs';
  }

  // Check for Remix
  if (paths.some((p) => CONFIG_FILES.remixConfig.test(p))) {
    return 'remix';
  }

  // Check for Astro
  if (paths.some((p) => CONFIG_FILES.astroConfig.test(p))) {
    return 'astro';
  }

  // Check for Angular
  if (paths.some((p) => CONFIG_FILES.angularJson.test(p))) {
    return 'angular';
  }

  // Check for Vue
  if (paths.some((p) => CONFIG_FILES.vueConfig.test(p) || p.endsWith('App.vue'))) {
    return 'vue';
  }

  // Check for Svelte
  if (paths.some((p) => CONFIG_FILES.svelteConfig.test(p) || p.endsWith('.svelte'))) {
    return 'svelte';
  }

  // Check for Vite
  if (paths.some((p) => CONFIG_FILES.viteConfig.test(p))) {
    return 'vite';
  }

  // Check for React (without specific framework)
  if (paths.some((p) => /\.(jsx|tsx)$/.test(p))) {
    return 'react';
  }

  // Check for Node.js project (has package.json but no framework-specific files)
  if (paths.some((p) => CONFIG_FILES.packageJson.test(p))) {
    return 'node';
  }

  // Static HTML project
  if (paths.some((p) => /\.html?$/.test(p))) {
    return 'static';
  }

  return 'unknown';
}

/**
 * Validate package.json content
 */
function validatePackageJson(content: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  try {
    const pkg = JSON.parse(content);

    // Check for name
    if (!pkg.name) {
      issues.push({
        severity: 'warning',
        message: 'package.json missing "name" field',
        suggestion: 'Add a name field to identify your project',
        filePath: 'package.json',
      });
    }

    // Check for version
    if (!pkg.version) {
      issues.push({
        severity: 'info',
        message: 'package.json missing "version" field',
        suggestion: 'Consider adding a version field (e.g., "1.0.0")',
        filePath: 'package.json',
      });
    }

    // Check for scripts
    if (!pkg.scripts || Object.keys(pkg.scripts).length === 0) {
      issues.push({
        severity: 'warning',
        message: 'package.json has no scripts defined',
        suggestion: 'Add build, dev, or test scripts for your project',
        filePath: 'package.json',
      });
    }

    // Check for dependencies
    const hasDeps = pkg.dependencies && Object.keys(pkg.dependencies).length > 0;
    const hasDevDeps = pkg.devDependencies && Object.keys(pkg.devDependencies).length > 0;

    if (!hasDeps && !hasDevDeps) {
      issues.push({
        severity: 'info',
        message: 'package.json has no dependencies',
        suggestion: 'This might be expected for a minimal project',
        filePath: 'package.json',
      });
    }
  } catch (error) {
    issues.push({
      severity: 'error',
      message: `Invalid package.json: ${error instanceof Error ? error.message : 'Parse error'}`,
      suggestion: 'Fix JSON syntax errors in package.json',
      filePath: 'package.json',
    });
  }

  return issues;
}

/**
 * Validate tsconfig.json content
 */
function validateTsConfig(content: string, filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  try {
    // Remove comments (basic approach, not perfect but sufficient)
    const jsonContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*/g, ''); // Remove // comments

    const tsconfig = JSON.parse(jsonContent);

    // Check for compilerOptions
    if (!tsconfig.compilerOptions) {
      issues.push({
        severity: 'warning',
        message: 'tsconfig.json missing "compilerOptions"',
        suggestion: 'Add compilerOptions to configure TypeScript compiler',
        filePath,
      });
    }
  } catch (error) {
    issues.push({
      severity: 'warning',
      message: `Invalid tsconfig.json: ${error instanceof Error ? error.message : 'Parse error'}`,
      suggestion: 'Fix JSON syntax errors (note: comments are allowed in tsconfig.json)',
      filePath,
    });
  }

  return issues;
}

/**
 * Validate file structure consistency
 */
function validateFileStructure(fileMap: FileMap, projectType: ProjectType): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const paths = Object.keys(fileMap);

  // Check for common structure issues based on project type
  switch (projectType) {
    case 'react':
    case 'nextjs':
    case 'remix':
    case 'vite':
      // Should have src or app directory
      const hasSrcOrApp = paths.some((p) => p.includes('/src/') || p.includes('/app/'));
      if (!hasSrcOrApp && paths.length > 5) {
        issues.push({
          severity: 'info',
          message: 'No src/ or app/ directory found',
          suggestion: 'Consider organizing source files in a src/ or app/ directory',
        });
      }
      break;

    case 'node':
      // Check for index.js or main entry point
      const hasEntry = paths.some((p) => /\/(index|main|server)\.(js|ts)$/.test(p));
      if (!hasEntry) {
        issues.push({
          severity: 'info',
          message: 'No obvious entry point (index.js, main.js, server.js) found',
          suggestion: 'Ensure your package.json points to the correct main file',
        });
      }
      break;

    case 'static':
      // Check for index.html
      const hasIndexHtml = paths.some((p) => /\/index\.html?$/.test(p));
      if (!hasIndexHtml) {
        issues.push({
          severity: 'warning',
          message: 'No index.html found in static project',
          suggestion: 'Create an index.html as the entry point',
        });
      }
      break;
  }

  return issues;
}

/**
 * Validate file paths for common issues
 */
function validateFilePaths(fileMap: FileMap): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const paths = Object.keys(fileMap);

  for (const path of paths) {
    // Check for invalid characters
    if (/[<>:"|?*]/.test(path)) {
      issues.push({
        severity: 'error',
        message: `Invalid characters in file path: ${path}`,
        suggestion: 'Remove special characters from file names',
        filePath: path,
      });
    }

    // Check for very long paths (>260 chars - Windows limitation)
    if (path.length > 260) {
      issues.push({
        severity: 'warning',
        message: `Very long file path (${path.length} chars): ${path.substring(0, 50)}...`,
        suggestion: 'Consider shortening directory or file names',
        filePath: path,
      });
    }

    // Check for paths with multiple dots (potential hidden files)
    const fileName = path.split('/').pop() || '';
    if (fileName.startsWith('.') && fileName !== '.gitignore' && fileName !== '.env.example') {
      issues.push({
        severity: 'info',
        message: `Hidden/config file detected: ${fileName}`,
        filePath: path,
      });
    }
  }

  return issues;
}

/**
 * Validate project files before restoration
 *
 * @param fileMap - Map of files to validate
 * @returns Validation result with issues and metadata
 */
export function validateProject(fileMap: FileMap): ValidationResult {
  logger.info('Starting project validation...');

  const issues: ValidationIssue[] = [];
  const paths = Object.keys(fileMap);

  // Basic checks
  const totalFiles = paths.length;

  if (totalFiles === 0) {
    issues.push({
      severity: 'error',
      message: 'No files found in project',
      suggestion: 'Ensure chat history contains file data',
    });

    return {
      valid: false,
      issues,
      hasPackageJson: false,
      hasTsConfig: false,
      totalFiles: 0,
    };
  }

  // Detect project type
  const projectType = detectProjectType(fileMap);
  logger.info(`Detected project type: ${projectType}`);

  // Check for package.json
  const packageJsonPath = paths.find((p) => CONFIG_FILES.packageJson.test(p));
  const hasPackageJson = !!packageJsonPath;

  if (!hasPackageJson && projectType !== 'static' && projectType !== 'unknown') {
    issues.push({
      severity: 'warning',
      message: 'No package.json found',
      suggestion: 'Create a package.json to manage dependencies',
    });
  }

  // Validate package.json if exists
  if (packageJsonPath) {
    const packageFile = fileMap[packageJsonPath];
    if (packageFile && packageFile.type === 'file') {
      issues.push(...validatePackageJson(packageFile.content));
    }
  }

  // Check for tsconfig.json
  const tsconfigPath = paths.find((p) => CONFIG_FILES.tsconfig.test(p));
  const hasTsConfig = !!tsconfigPath;

  // Validate tsconfig.json if exists
  if (tsconfigPath) {
    const tsconfigFile = fileMap[tsconfigPath];
    if (tsconfigFile && tsconfigFile.type === 'file') {
      issues.push(...validateTsConfig(tsconfigFile.content, tsconfigPath));
    }
  }

  // Validate file structure
  issues.push(...validateFileStructure(fileMap, projectType));

  // Validate file paths
  issues.push(...validateFilePaths(fileMap));

  // Check if any critical errors exist
  const hasErrors = issues.some((issue) => issue.severity === 'error');
  const valid = !hasErrors;

  logger.info(
    `Validation complete: ${valid ? 'VALID' : 'INVALID'} - ${issues.length} issues (${issues.filter((i) => i.severity === 'error').length} errors, ${issues.filter((i) => i.severity === 'warning').length} warnings)`,
  );

  return {
    valid,
    issues,
    projectType,
    hasPackageJson,
    hasTsConfig,
    totalFiles,
  };
}

/**
 * Format validation issues for display
 */
export function formatValidationIssues(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return 'No issues found';
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const infos = issues.filter((i) => i.severity === 'info');

  const parts: string[] = [];

  if (errors.length > 0) {
    parts.push(`${errors.length} error${errors.length === 1 ? '' : 's'}`);
  }

  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning${warnings.length === 1 ? '' : 's'}`);
  }

  if (infos.length > 0) {
    parts.push(`${infos.length} info`);
  }

  return parts.join(', ');
}

/**
 * Get summary of validation result
 */
export function getValidationSummary(result: ValidationResult): string {
  const { valid, projectType, hasPackageJson, totalFiles, issues } = result;

  let summary = `Project: ${projectType || 'unknown'}, ${totalFiles} files`;

  if (hasPackageJson) {
    summary += ', has package.json';
  }

  if (!valid) {
    summary += ` - ${formatValidationIssues(issues)}`;
  }

  return summary;
}

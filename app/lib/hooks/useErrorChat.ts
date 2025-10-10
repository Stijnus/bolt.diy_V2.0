import { useCallback } from 'react';
import { chatStore } from '~/lib/stores/chat';
import type { DevServerError } from '~/types/errors';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('useErrorChat');

export function useErrorChat() {
  /**
   * Format error for AI consumption
   */
  const formatErrorForAI = useCallback((error: DevServerError, fileContent?: string): string => {
    const parts: string[] = [
      '🔴 **Error Detected**',
      '',
      `**Type:** ${error.type} (${error.severity})`,
      `**Source:** ${error.source}`,
      '',
      '**Message:**',
      '```',
      error.message,
      '```',
    ];

    if (error.file) {
      parts.push('', '**Location:**');
      parts.push(`- File: \`${error.file}\``);

      if (error.line) {
        parts.push(`- Line: ${error.line}`);
      }

      if (error.column) {
        parts.push(`- Column: ${error.column}`);
      }
    }

    if (fileContent && error.file) {
      parts.push('', '**File Content:**');
      parts.push('```' + getFileExtension(error.file));

      if (error.line) {
        // Include context around the error line (5 lines before and after)
        const lines = fileContent.split('\n');
        const startLine = Math.max(0, error.line - 6);
        const endLine = Math.min(lines.length, error.line + 5);
        const contextLines = lines.slice(startLine, endLine);

        contextLines.forEach((line, index) => {
          const lineNum = startLine + index + 1;
          const marker = lineNum === error.line ? '→' : ' ';
          parts.push(`${marker} ${lineNum.toString().padStart(4)} | ${line}`);
        });
      } else {
        parts.push(fileContent);
      }

      parts.push('```');
    }

    if (error.stack) {
      parts.push('', '**Stack Trace:**');
      parts.push('```');
      parts.push(error.stack);
      parts.push('```');
    }

    parts.push('', '---', '', '**Can you help me fix this error?**');
    parts.push('Please analyze the error and suggest a fix.');

    return parts.join('\n');
  }, []);

  /**
   * Send error to chat for AI assistance
   */
  const sendErrorToChat = useCallback(
    (error: DevServerError, fileContent?: string, onSuccess?: () => void) => {
      try {
        const errorMessage = formatErrorForAI(error, fileContent);

        /*
         * Set the chat input with the error message
         * The user can review and send it
         */
        logger.info('Preparing error for AI assistance:', {
          type: error.type,
          file: error.file,
          line: error.line,
        });

        // Switch to chat view
        chatStore.setKey('showChat', true);

        // Return the formatted message so it can be set in the input
        onSuccess?.();

        return errorMessage;
      } catch (err) {
        logger.error('Failed to send error to chat:', err);
        return null;
      }
    },
    [formatErrorForAI],
  );

  return {
    formatErrorForAI,
    sendErrorToChat,
  };
}

function getFileExtension(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    rb: 'ruby',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
  };

  return ext && languageMap[ext] ? languageMap[ext] : ext || '';
}

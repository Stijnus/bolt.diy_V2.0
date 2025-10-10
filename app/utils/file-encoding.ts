/**
 * File encoding utilities for handling binary files in chat history
 */

/**
 * Encodes a string to base64
 * @param content The string content to encode
 * @returns Base64-encoded string
 */
export function encodeToBase64(content: string): string {
  if (typeof window !== 'undefined' && window.btoa) {
    // Browser environment
    return window.btoa(content);
  } else {
    // Node environment (for SSR)
    return Buffer.from(content, 'binary').toString('base64');
  }
}

/**
 * Decodes a base64 string
 * @param base64Content The base64-encoded string
 * @returns Decoded string
 */
export function decodeFromBase64(base64Content: string): string {
  if (typeof window !== 'undefined' && window.atob) {
    // Browser environment
    return window.atob(base64Content);
  } else {
    // Node environment (for SSR)
    return Buffer.from(base64Content, 'base64').toString('binary');
  }
}

/**
 * Converts a Uint8Array to a base64 string
 * @param uint8Array The Uint8Array to convert
 * @returns Base64-encoded string
 */
export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binary = '';

  const len = uint8Array.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }

  return encodeToBase64(binary);
}

/**
 * Converts a base64 string to a Uint8Array
 * @param base64 The base64 string to convert
 * @returns Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = decodeFromBase64(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

/**
 * Safely encodes file content for storage
 * If the file is binary, encodes as base64. Otherwise, returns as-is.
 *
 * @param content The file content
 * @param isBinary Whether the file is binary
 * @returns Encoded content and encoding type
 */
export function encodeFileContent(
  content: string,
  isBinary: boolean,
): { content: string; encoding: 'plain' | 'base64' } {
  if (!isBinary) {
    return { content, encoding: 'plain' };
  }

  try {
    const encoded = encodeToBase64(content);
    return { content: encoded, encoding: 'base64' };
  } catch (error) {
    console.error('Failed to encode binary file:', error);

    // Fallback to plain if encoding fails
    return { content: '', encoding: 'plain' };
  }
}

/**
 * Decodes file content from storage
 * If the file was base64-encoded, decodes it. Otherwise, returns as-is.
 *
 * @param content The stored file content
 * @param encoding The encoding type used
 * @returns Decoded content
 */
export function decodeFileContent(content: string, encoding: 'plain' | 'base64' = 'plain'): string {
  if (encoding !== 'base64') {
    return content;
  }

  try {
    return decodeFromBase64(content);
  } catch (error) {
    console.error('Failed to decode base64 file:', error);
    return '';
  }
}

/**
 * Checks if content appears to be base64-encoded
 * @param content The content to check
 * @returns true if content looks like base64
 */
export function isBase64(content: string): boolean {
  if (!content || content.length === 0) {
    return false;
  }

  // Base64 should only contain valid characters
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

  return base64Regex.test(content);
}

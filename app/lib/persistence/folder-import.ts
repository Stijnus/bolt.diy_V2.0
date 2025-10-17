import { getDatabase, setMessages, generateChatId } from '~/lib/persistence/db';
import { currentModel } from '~/lib/stores/model';
import { projectStore } from '~/lib/stores/project';
import { createClient } from '~/lib/supabase/client';
import { WORK_DIR } from '~/utils/constants';
import { uint8ArrayToBase64 } from '~/utils/file-encoding';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('FolderImport');

// Keep ignore patterns aligned with FilesStore.DEFAULT_HIDDEN_PATTERNS
const IGNORE_PATTERNS: RegExp[] = [
  /\/node_modules\//,
  /\/\.next/,
  /\/\.astro/,
  /\/\.git/,
  /\/\.vscode/,
  /\/\.idea/,
  /\/dist/,
  /\/build/,
  /\/\.cache/,
  /\/coverage/,
  /\/\.nyc_output/,
  /\/\.DS_Store/,
  /\/Thumbs\.db/,
];

export function shouldIgnore(relPath: string): boolean {
  const normalized = `/${relPath}`.replace(/\\/g, '/');
  return IGNORE_PATTERNS.some((re) => re.test(normalized));
}

async function readFileToEntry(file: File, relPath: string) {
  // Default to text; treat unknown types as text unless very likely binary
  try {
    const mime = file.type || '';
    const lower = relPath.toLowerCase();

    const isTextLikely =
      mime.startsWith('text/') ||
      mime.includes('json') ||
      mime.includes('xml') ||
      mime.includes('javascript') ||
      mime.includes('typescript') ||
      mime.includes('+xml') ||
      /\.(txt|md|json|yaml|yml|toml|xml|html|htm|css|scss|sass|less|js|jsx|ts|tsx|vue|svelte|astro|cjs|mjs|config|gitignore|gitattributes|env|sh|bash|zsh|py|rb|go|rs|java|kt|c|h|cpp|hpp|cs)$/i.test(
        lower,
      );

    if (isTextLikely) {
      const content = await file.text();
      return { content, isBinary: false, encoding: 'plain' as const };
    }

    // Fallback: read as binary and store base64
    const ab = await file.arrayBuffer();
    const uint8 = new Uint8Array(ab);
    const base64 = uint8ArrayToBase64(uint8);

    return { content: base64, isBinary: true, encoding: 'base64' as const };
  } catch (e) {
    logger.warn(`Failed to read file ${relPath}, skipping`, e);
    return null;
  }
}

function stripRootFolder(files: FileList): { entries: Array<{ file: File; relPath: string }>; root?: string } {
  const out: Array<{ file: File; relPath: string }> = [];

  let root: string | undefined;

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const wrp = (file as any).webkitRelativePath as string | undefined;
    const full = wrp && wrp.length > 0 ? wrp : file.name;
    const norm = full.replace(/\\/g, '/');
    const parts = norm.split('/');

    if (!root && parts.length > 1) {
      root = parts[0];
    }

    const rel = root && norm.startsWith(root + '/') ? norm.slice(root.length + 1) : norm;
    out.push({ file, relPath: rel });
  }

  return { entries: out, root };
}

export type ImportResult =
  | { success: true; chatId: string; cloud?: { status: 'ok' | 'error'; message?: string } }
  | { success: false; error: string };

export type ImportPreview = {
  rootName?: string;
  totalFiles: number;
  textFiles: number;
  binaryFiles: number;
  topLevelFolders: string[];
  topLevelFiles: number;
  totalBytes?: number;
  folderStats?: Array<{ name: string; files: number; bytes: number }>;
  detected?: { framework?: string; packageManager?: string; installCmd: string; devCmd: string };
};

function detectTooling(
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>,
): { framework?: string; packageManager?: string; installCmd: string; devCmd: string } | undefined {
  try {
    const has = (p: string) => Boolean(fileState[p]);
    const pkgPath = `${WORK_DIR}/package.json`;

    let pm: 'pnpm' | 'yarn' | 'bun' | 'npm' = 'npm';

    if (has(`${WORK_DIR}/pnpm-lock.yaml`)) {
      pm = 'pnpm';
    } else if (has(`${WORK_DIR}/yarn.lock`)) {
      pm = 'yarn';
    } else if (has(`${WORK_DIR}/bun.lockb`)) {
      pm = 'bun';
    }

    let framework: string | undefined;
    let devScript = 'dev';

    if (fileState[pkgPath] && !fileState[pkgPath].isBinary) {
      const raw = fileState[pkgPath].content;
      const pkg = JSON.parse(raw);
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const scripts = pkg.scripts || {};

      if (typeof scripts.dev === 'string') {
        devScript = 'dev';
      } else if (typeof scripts.start === 'string') {
        devScript = 'start';
      }

      if (deps.next) {
        framework = 'Next.js';
      } else if (deps['@remix-run/react'] || deps['@remix-run/node'] || deps.remix) {
        framework = 'Remix';
      } else if (deps.astro) {
        framework = 'Astro';
      } else if (deps['@sveltejs/kit']) {
        framework = 'SvelteKit';
      } else if (deps.vite) {
        framework = 'Vite';
      } else if (deps['react-scripts']) {
        framework = 'Create React App';
      } else if (deps.nuxt) {
        framework = 'Nuxt';
      } else if (deps['@angular/core']) {
        framework = 'Angular';
      }
    } else {
      // Fallback by config files
      if (has(`${WORK_DIR}/next.config.js`) || has(`${WORK_DIR}/next.config.mjs`)) {
        framework = 'Next.js';
      } else if (has(`${WORK_DIR}/remix.config.js`) || has(`${WORK_DIR}/remix.config.mjs`)) {
        framework = 'Remix';
      } else if (has(`${WORK_DIR}/astro.config.mjs`) || has(`${WORK_DIR}/astro.config.ts`)) {
        framework = 'Astro';
      } else if (has(`${WORK_DIR}/svelte.config.js`) || has(`${WORK_DIR}/svelte.config.cjs`)) {
        framework = 'SvelteKit';
      } else if (has(`${WORK_DIR}/vite.config.ts`) || has(`${WORK_DIR}/vite.config.js`)) {
        framework = 'Vite';
      }
    }

    const installCmd = `${pm} install`;
    const devCmd = pm === 'yarn' ? `${pm} ${devScript}` : `${pm} run ${devScript}`;

    return { framework, packageManager: pm, installCmd, devCmd };
  } catch {
    return undefined;
  }
}

function summarizeFileState(
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>,
  sizeMap?: Record<string, number>,
): ImportPreview {
  const topFolders = new Set<string>();

  let text = 0;
  let bin = 0;
  let topFiles = 0;
  let totalBytes = 0;

  const folderFiles = new Map<string, number>();
  const folderBytes = new Map<string, number>();

  for (const abs of Object.keys(fileState)) {
    const rel = abs.replace(`${WORK_DIR}/`, '');
    const seg = rel.split('/')[0] || rel;
    const isFolder = rel.includes('/');

    if (isFolder) {
      topFolders.add(seg);
    } else {
      topFiles++;
    }

    if (fileState[abs].isBinary) {
      bin++;
    } else {
      text++;
    }

    const bytes =
      sizeMap?.[abs] ??
      (() => {
        try {
          const v = fileState[abs];

          if (v.isBinary && v.encoding === 'base64') {
            const len = v.content.length;
            return Math.floor((len * 3) / 4);
          }

          // Text: approximate UTF-8 length

          return new TextEncoder().encode(v.content).length;
        } catch {
          return 0;
        }
      })();

    totalBytes += bytes;

    if (isFolder) {
      folderFiles.set(seg, (folderFiles.get(seg) || 0) + 1);
      folderBytes.set(seg, (folderBytes.get(seg) || 0) + bytes);
    }
  }

  const folderStats = Array.from(topFolders)
    .map((name) => ({ name, files: folderFiles.get(name) || 0, bytes: folderBytes.get(name) || 0 }))
    .sort((a, b) => b.bytes - a.bytes);

  return {
    totalFiles: Object.keys(fileState).length,
    textFiles: text,
    binaryFiles: bin,
    topLevelFolders: Array.from(topFolders).sort(),
    topLevelFiles: topFiles,
    totalBytes,
    folderStats,
    detected: detectTooling(fileState),
  };
}

export async function persistImportedProject(
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>,
  title: string,
  userId?: string,
  projectId?: string | null,
): Promise<ImportResult> {
  try {
    const db = await getDatabase();

    if (!db) {
      return { success: false, error: 'IndexedDB unavailable' };
    }

    const id = generateChatId();
    const modelFull = currentModel.get().fullId;
    const effectiveProjectId = projectId ?? projectStore.get().currentProjectId ?? null;

    const firstMsg = {
      role: 'user',
      parts: [{ type: 'text', text: `Imported local project: ${title}.` }],
    } as any;

    await setMessages(
      db,
      id,
      [firstMsg],
      id,
      title,
      modelFull,
      new Date().toISOString(),
      'local',
      fileState,
      undefined,
      undefined,
      undefined,
      effectiveProjectId,
    );

    let cloud: { status: 'ok' | 'error'; message?: string } | undefined = undefined;

    if (userId) {
      try {
        const supabase = createClient();

        const { error } = await supabase.from('chats').upsert(
          {
            url_id: id,
            user_id: userId,
            messages: [firstMsg] as any,
            description: title,
            model: modelFull,
            file_state: fileState,
            project_id: effectiveProjectId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'url_id,user_id' },
        );

        if (error) {
          cloud = { status: 'error', message: `${error.code || ''} ${error.message || 'Upsert failed'}`.trim() };
        } else {
          cloud = { status: 'ok' };
        }
      } catch (e: any) {
        logger.warn('Supabase upsert failed for imported project (continuing with local only)', e);
        cloud = { status: 'error', message: e?.message || 'Supabase upsert failed' };
      }
    }

    return { success: true, chatId: id, cloud };
  } catch (e: any) {
    logger.error('Persist imported project failed', e);
    return { success: false, error: e?.message || 'Import failed' };
  }
}

export async function scanDirectoryForPreview(dir: FileSystemDirectoryHandle): Promise<{
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;
  preview: ImportPreview;
}> {
  const rootName = (dir as any).name as string | undefined;
  const sizeMap: Record<string, number> = {};

  // Collect while tracking sizes
  const map: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }> = {};

  async function walk(handle: FileSystemDirectoryHandle, prefix: string) {
    // @ts-ignore - File System Access API entries() not typed in TS lib for all browsers
    for await (const [name, entry] of (handle as any).entries()) {
      const relPath = prefix ? `${prefix}/${name}` : name;

      if (shouldIgnore(relPath)) {
        continue;
      }

      if (entry.kind === 'directory') {
        await walk(entry as FileSystemDirectoryHandle, relPath);
      } else if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();
        sizeMap[`${WORK_DIR}/${relPath}`.replace(/\\/g, '/')] = file.size;

        const result = await readFileToEntry(file, relPath);

        if (result) {
          const abs = `${WORK_DIR}/${relPath}`.replace(/\\/g, '/');
          map[abs] = { content: result.content, isBinary: result.isBinary, encoding: result.encoding };
        }
      }
    }
  }
  await walk(dir, '');

  const fileState = map;
  const preview = { ...summarizeFileState(fileState, sizeMap), rootName };

  return { fileState, preview };
}

export async function scanFileListForPreview(files: FileList): Promise<{
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;
  preview: ImportPreview;
}> {
  const { entries, root } = stripRootFolder(files);
  const fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }> = {};
  const sizeMap: Record<string, number> = {};

  for (const { file, relPath } of entries) {
    if (shouldIgnore(relPath)) {
      continue;
    }

    const result = await readFileToEntry(file, relPath);

    if (result) {
      const abs = `${WORK_DIR}/${relPath}`.replace(/\\/g, '/');
      sizeMap[abs] = file.size;
      fileState[abs] = { content: result.content, isBinary: result.isBinary, encoding: result.encoding };
    }
  }

  const preview = { ...summarizeFileState(fileState, sizeMap), rootName: root };

  return { fileState, preview };
}

export type EntrySpec = { file: File; relPath: string };

export async function buildFileStateFromEntries(entries: EntrySpec[]): Promise<{
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;
  sizeMap: Record<string, number>;
}> {
  const fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }> = {};
  const sizeMap: Record<string, number> = {};

  for (const { file, relPath } of entries) {
    if (shouldIgnore(relPath)) {
      continue;
    }

    const result = await readFileToEntry(file, relPath);

    if (result) {
      const abs = `${WORK_DIR}/${relPath}`.replace(/\\/g, '/');
      sizeMap[abs] = file.size;
      fileState[abs] = { content: result.content, isBinary: result.isBinary, encoding: result.encoding };
    }
  }

  return { fileState, sizeMap };
}

export function summarizeEntries(
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>,
  rootName?: string,
  sizeMap?: Record<string, number>,
): {
  fileState: Record<string, { content: string; isBinary: boolean; encoding?: 'plain' | 'base64' }>;
  preview: ImportPreview;
} {
  return { fileState, preview: { ...summarizeFileState(fileState, sizeMap), rootName } };
}

export async function importProjectFromDirectoryHandle(
  dir: FileSystemDirectoryHandle,
  userId?: string,
): Promise<ImportResult> {
  try {
    const { fileState, preview } = await scanDirectoryForPreview(dir);
    return await persistImportedProject(fileState, preview.rootName || 'Imported Project', userId);
  } catch (e: any) {
    logger.error('Import from directory handle failed', e);
    return { success: false, error: e?.message || 'Import failed' };
  }
}

export async function importProjectFromFileList(files: FileList, userId?: string): Promise<ImportResult> {
  try {
    const { fileState, preview } = await scanFileListForPreview(files);
    return await persistImportedProject(fileState, preview.rootName || 'Imported Project', userId);
  } catch (e: any) {
    logger.error('Import from file list failed', e);
    return { success: false, error: e?.message || 'Import failed' };
  }
}

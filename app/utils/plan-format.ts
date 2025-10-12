/*
 * Plan formatting utilities: normalize model outputs (XML or Markdown) into a clean Markdown plan.
 */

const SECTION_ORDER = [
  'Overview',
  'Architecture',
  'Files to Create/Modify',
  'Dependencies',
  'Commands',
  'Implementation Steps',
  'Risks & Assumptions',
  'Acceptance Criteria',
  'Milestones',
] as const;

const SECTION_SYNONYMS: Record<string, RegExp[]> = {
  Overview: [/^overview\b/i],
  Architecture: [/^architecture\b/i, /^tech(?:nical)?\s+design\b/i, /^design\b/i],
  'Files to Create/Modify': [/^files(?:\s+to\s+(create|modify))?/i, /^file(?:s)?\b/i],
  Dependencies: [/^dependencies\b/i, /^packages\b/i, /^libraries\b/i],
  Commands: [/^commands\b/i, /^setup\s+commands\b/i, /^shell\s+commands\b/i],
  'Implementation Steps': [/^implementation\s+steps\b/i, /^steps\b/i, /^plan\b/i, /^execution\s+steps\b/i],
  'Risks & Assumptions': [/^risks\s*&?\s*assumptions\b/i],
  'Acceptance Criteria': [/^acceptance\s+criteria\b/i, /^success\s+criteria\b/i, /^done\b/i],
  Milestones: [/^milestones\b/i, /^timeline\b/i],
};

function extractPlanInner(raw: string): string {
  const planMatch = raw.match(/<plan_document[^>]*>([\s\S]*?)<\/plan_document>/i);
  return planMatch ? planMatch[1] : raw;
}

function xmlTagsToMarkdown(inner: string): string {
  let md = inner;

  const tagToHeading: Array<[string, string]> = [
    ['overview', '## Overview'],
    ['architecture', '## Architecture'],
    ['files_to_create_modify', '## Files to Create/Modify'],
    ['files_to_create', '## Files to Create'],
    ['files_to_modify', '## Files to Modify'],
    ['dependencies', '## Dependencies'],
    ['commands', '## Commands'],
    ['implementation_steps', '## Implementation Steps'],
    ['risks_and_assumptions', '## Risks & Assumptions'],
    ['risks', '## Risks'],
    ['assumptions', '## Assumptions'],
    ['acceptance_criteria', '## Acceptance Criteria'],
    ['milestones', '## Milestones'],
  ];

  for (const [tag, heading] of tagToHeading) {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'gi');
    md = md.replace(re, (_m, body) => `${heading}\n\n${String(body).trim()}\n\n`);
  }

  // Convert "Section: content" lines to headings
  md = md.replace(
    /^\s*(overview|architecture|files?[^:]*|dependencies|commands|implementation\s+steps|risks\s*&?\s*assumptions|acceptance\s+criteria|milestones)\s*:\s*/gim,
    (_m, s) =>
      `\n## ${String(s)
        .replace(/\s+/g, ' ')
        .replace(/^\w/, (c: string) => c.toUpperCase())}\n\n`,
  );

  // Strip remaining unknown tags
  md = md.replace(/<[^>]+>/g, '');

  return md;
}

export function formatPlanToMarkdown(rawInput: string): string {
  let md = extractPlanInner(rawInput).trim();
  md = xmlTagsToMarkdown(md);

  // Normalize heading levels to H2 for recognized sections
  md = md.replace(/^\s*#{1,6}\s*(.+)$/gm, (_m, title) => {
    const t = String(title).trim();

    // If it matches any known section or synonyms, force to H2
    const isKnown = SECTION_ORDER.some((sec) => {
      const rxList = SECTION_SYNONYMS[sec] || [];
      return rxList.some((rx) => rx.test(t)) || new RegExp(`^${sec}$`, 'i').test(t);
    });

    return isKnown ? `## ${t.replace(/^#+\s*/, '')}` : `### ${t.replace(/^#+\s*/, '')}`;
  });

  // Standardize bullet markers
  md = md.replace(/^\s*[\-\*]\s*/gm, '- ');

  // Format command blocks: if a Commands section exists and lines look like shell commands, wrap in code block
  md = md.replace(/(^##\s*Commands[\s\S]*?)(?=^##\s|\Z)/gim, (section) => {
    const lines = section.split('\n');
    const header = lines.shift();
    const body = lines.join('\n').trim();

    if (!body) {
      return section;
    }

    const fenced = body.match(/```/) ? body : '```bash\n' + body.replace(/^\-\s*/gm, '').trim() + '\n```';

    return `${header}\n\n${fenced}\n`;
  });

  // Normalize extra blank lines
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  // Ensure title
  if (!/^#\s+/m.test(md)) {
    md = `# Plan\n\n${md}`;
  }

  return md;
}

export function detectMarkdownPlan(raw: string): boolean {
  const text = extractPlanInner(raw);

  // Consider it a plan if it either contains <plan_document> or at least 3 key H2 headings
  if (/<plan_document[\s>]/i.test(raw)) {
    return true;
  }

  const found = SECTION_ORDER.filter((sec) => new RegExp(`^##\s*${sec}\b`, 'im').test(text)).length;

  return found >= 3;
}

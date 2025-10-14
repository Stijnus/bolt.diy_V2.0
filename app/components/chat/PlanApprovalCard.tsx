import { useStore } from '@nanostores/react';
import { useStore as useNanoStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { Check, X, Copy, Download } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { Markdown } from './Markdown';
import { PROVIDERS } from '~/lib/models.client';
import { chatModeStore, approvePlan, rejectPlan } from '~/lib/stores/chat-mode';
import { settingsStore } from '~/lib/stores/settings';
import { cn } from '~/lib/utils';
import { formatPlanToMarkdown } from '~/utils/plan-format';

interface PlanApprovalCardProps {
  onApprove: (planContent: string) => void;
  onReject: () => void;
}

export const PlanApprovalCard = memo(({ onApprove, onReject }: PlanApprovalCardProps) => {
  const { pendingPlan } = useStore(chatModeStore);
  const userSettings = useNanoStore(settingsStore);
  const [showTemplate, setShowTemplate] = useState(false);

  const planModelId = userSettings.ai?.planModel || userSettings.ai?.defaultModel;

  const planModelInfo = (() => {
    for (const p of PROVIDERS) {
      const match = p.models.find((m) => `${p.id}:${m.id}` === planModelId);

      if (match) {
        return { provider: p.name, name: match.name };
      }
    }
    return null;
  })();

  const handleApprove = () => {
    const planContent = approvePlan();

    if (planContent) {
      onApprove(planContent);
    }
  };

  const handleReject = () => {
    rejectPlan();
    onReject();
  };

  // Prepare nicely-formatted plan content for display
  const displayContent = useMemo(() => {
    const raw = pendingPlan?.content ?? '';

    // 1) Prefer explicit <plan_document> ... </plan_document>
    const planMatch = raw.match(/<plan_document[^>]*>([\s\S]*?)<\/plan_document>/i);

    if (planMatch && planMatch[1]) {
      return formatPlanToMarkdown(planMatch[1]);
    }

    // 2) If artifacts are present, summarize into readable Markdown
    const hasArtifact = /<boltArtifact[\s>]/i.test(raw);
    const hasAction = /<boltAction[\s>]/i.test(raw);

    if (hasArtifact || hasAction) {
      const files = Array.from(raw.matchAll(/<boltAction[^>]*type=\"file\"[^>]*filePath=\"([^\"]+)\"/g)).map(
        (m) => m[1],
      );
      const shells = Array.from(raw.matchAll(/<boltAction[^>]*type=\"shell\"[^>]*>([\s\S]*?)<\/boltAction>/g)).map(
        (m) => m[1].trim(),
      );

      const filesList =
        files
          .slice(0, 20)
          .map((f) => `- ${f}`)
          .join('\n') || '- (none)';
      const shellList =
        shells
          .slice(0, 20)
          .map((s) => `- ${s}`)
          .join('\n') || '- (none)';

      const extraCounts = [
        files.length > 20 ? `\n…and ${files.length - 20} more files` : '',
        shells.length > 20 ? `\n…and ${shells.length - 20} more commands` : '',
      ]
        .filter(Boolean)
        .join('');

      return [
        '### Proposed Actions (summary)',
        '',
        '**Files to create/modify:**',
        filesList,
        '',
        '**Shell commands to run:**',
        shellList,
        extraCounts,
        '',
        '> Note: You are in Plan mode. Nothing will execute until you Approve.',
      ]
        .filter(Boolean)
        .join('\n');
    }

    // 3) Fallback: show raw content in a code block for readability
    return ['```', raw.trim(), '```'].join('\n');
  }, [pendingPlan?.content]);

  if (!pendingPlan) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="mb-4"
    >
      <div className="rounded-2xl border-2 border-bolt-elements-borderColor bg-gradient-to-br from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-bolt-elements-background-depth-3 border-b border-bolt-elements-borderColor">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Plan Ready for Review</h3>
            </div>
            <div className="flex items-center gap-3">
              {planModelInfo ? (
                <span className="rounded-full bg-bolt-elements-background-depth-1 px-2.5 py-1 text-xs text-bolt-elements-textSecondary border border-bolt-elements-borderColor">
                  Plan Agent:{' '}
                  <strong className="text-bolt-elements-textPrimary">
                    {planModelInfo.provider} • {planModelInfo.name}
                  </strong>
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(displayContent)}
                className={cn(
                  'text-sm px-2 py-1 rounded-md border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2',
                )}
                title="Copy Markdown"
              >
                <span className="inline-flex items-center gap-1">
                  <Copy className="w-4 h-4" /> Copy
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([displayContent], { type: 'text/markdown;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'plan.md';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className={cn(
                  'text-sm px-2 py-1 rounded-md border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2',
                )}
                title="Download Markdown"
              >
                <span className="inline-flex items-center gap-1">
                  <Download className="w-4 h-4" /> Download
                </span>
              </button>
              <div className="text-sm text-bolt-elements-textSecondary">
                Review the plan below and approve to execute
              </div>
            </div>
          </div>
        </div>

        {/* Plan Content */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            <Markdown limitedMarkdown>{displayContent}</Markdown>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-bolt-elements-background-depth-3 border-t border-bolt-elements-borderColor">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowTemplate((v) => !v)}
              className={cn(
                'text-xs px-2 py-1 rounded-md border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary',
              )}
            >
              {showTemplate ? 'Hide Plan Template' : 'View Plan Template'}
            </button>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReject}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                  'bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary',
                  'hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary',
                  'border border-bolt-elements-borderColor',
                )}
              >
                <X className="w-4 h-4" />
                <span>Revise Plan</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all',
                  'bg-gradient-to-r from-green-600 to-emerald-600 text-white',
                  'hover:from-green-500 hover:to-emerald-500',
                  'shadow-lg hover:shadow-xl',
                  'transform hover:scale-105',
                )}
              >
                <Check className="w-4 h-4" />
                <span>Approve & Execute</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Panel */}
      {showTemplate && (
        <div className="mt-3 rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4 text-xs text-bolt-elements-textSecondary">
          <div className="font-semibold text-bolt-elements-textPrimary mb-2">Required Plan Sections (H2):</div>
          <ul className="list-disc ml-5 space-y-1">
            <li>Overview</li>
            <li>Architecture</li>
            <li>Files to Create/Modify (path → purpose)</li>
            <li>Dependencies (versions)</li>
            <li>Commands (ordered, fenced bash)</li>
            <li>Implementation Steps (numbered)</li>
            <li>Risks & Assumptions</li>
            <li>Acceptance Criteria</li>
          </ul>
        </div>
      )}

      {/* Helper Text */}
      <div className="mt-2 px-2 text-xs text-bolt-elements-textTertiary text-center">
        Click "Approve & Execute" to proceed with the plan, or "Revise Plan" to provide feedback
      </div>
    </motion.div>
  );
});

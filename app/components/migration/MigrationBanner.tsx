import { Database, Loader2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '~/components/ui/Button';
import { useAuth } from '~/lib/contexts/AuthContext';
import { hasLocalChats, migrateIndexedDBToSupabase, type MigrationResult } from '~/lib/migration/migrate-to-supabase';

export function MigrationBanner() {
  const { user } = useAuth();
  const [hasChats, setHasChats] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    // only check for local chats if user is logged in
    if (!user) {
      return;
    }

    // check if migration banner was previously dismissed
    const wasDismissed = localStorage.getItem('migration-banner-dismissed');

    if (wasDismissed === 'true') {
      setDismissed(true);
      return;
    }

    // check if there are local chats to migrate
    hasLocalChats().then((has) => {
      setHasChats(has);
    });
  }, [user]);

  const handleMigrate = async () => {
    setMigrating(true);
    setResult(null);

    try {
      const migrationResult = await migrateIndexedDBToSupabase();
      setResult(migrationResult);

      if (migrationResult.success > 0) {
        toast.success(
          `Successfully migrated ${migrationResult.success} chat${migrationResult.success > 1 ? 's' : ''}!`,
        );
      }

      if (migrationResult.failed > 0) {
        toast.error(`Failed to migrate ${migrationResult.failed} chat${migrationResult.failed > 1 ? 's' : ''}`);
      }

      if (migrationResult.skipped > 0) {
        toast.info(
          `Skipped ${migrationResult.skipped} chat${migrationResult.skipped > 1 ? 's' : ''} (already migrated)`,
        );
      }
    } catch (error: any) {
      toast.error(error.message);
      setResult({
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [error.message],
        totalChats: 0,
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('migration-banner-dismissed', 'true');
  };

  /**
   * Don't show banner if:
   * - user is not logged in
   * - no local chats exist
   * - banner was dismissed
   * - migration completed successfully
   */
  if (!user || !hasChats || dismissed || (result && result.failed === 0 && result.success > 0)) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-bolt-elements-borderColor/80 bg-bolt-elements-background-depth-2/95 p-5 shadow-md">
      <div className="pointer-events-none absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-bolt-elements-button-primary-background/30 blur-3xl" />
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 items-start gap-3">
          <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text">
            <Database className="h-5 w-5" />
          </span>
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-semibold text-bolt-elements-textPrimary">Local chat history detected</h3>
              <p className="mt-1 text-sm text-bolt-elements-textSecondary">
                Migrate to the cloud to sync across devices and keep every conversation safe.
              </p>
            </div>

            {result ? (
              <div className="rounded-2xl border border-bolt-elements-borderColor/60 bg-bolt-elements-background-depth-1/80 px-4 py-3 text-sm text-bolt-elements-textSecondary">
                <div className="flex items-center gap-3 text-bolt-elements-textPrimary">
                  <strong className="text-sm">Migration results</strong>
                  <span className="text-xs text-bolt-elements-textSecondary">{result.totalChats} total chats</span>
                </div>
                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                  <div className="rounded-xl bg-bolt-elements-background-depth-2/70 px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-bolt-elements-textTertiary">Migrated</div>
                    <div className="text-sm font-semibold text-bolt-elements-button-primary-text">{result.success}</div>
                  </div>
                  <div className="rounded-xl bg-bolt-elements-background-depth-2/70 px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-bolt-elements-textTertiary">Skipped</div>
                    <div className="text-sm font-semibold text-bolt-elements-textSecondary">{result.skipped}</div>
                  </div>
                  <div className="rounded-xl bg-bolt-elements-button-danger-background/10 px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-bolt-elements-textTertiary">Failed</div>
                    <div className="text-sm font-semibold text-bolt-elements-button-danger-text">{result.failed}</div>
                  </div>
                </div>
                {result.errors.length > 0 ? (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer text-bolt-elements-button-danger-text">View errors</summary>
                    <ul className="ml-4 mt-1 list-disc space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-start">
          <Button onClick={handleMigrate} disabled={migrating} className="min-w-[140px]" size="md">
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Migrating…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Migrate now
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={handleDismiss}
            disabled={migrating}
            className="h-11 w-11 shrink-0 rounded-full"
            title="Dismiss this banner"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

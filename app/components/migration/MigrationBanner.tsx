import { useState, useEffect } from 'react'
import { migrateIndexedDBToSupabase, hasLocalChats, type MigrationResult } from '~/lib/migration/migrate-to-supabase'
import { useAuth } from '~/lib/contexts/AuthContext'
import { toast } from 'react-toastify'
import { Database, Upload, Loader2, X } from 'lucide-react'

export function MigrationBanner() {
  const { user } = useAuth()
  const [hasChats, setHasChats] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  useEffect(() => {
    // Only check for local chats if user is logged in
    if (!user) {
      return
    }

    // Check if migration banner was previously dismissed
    const wasDismissed = localStorage.getItem('migration-banner-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
      return
    }

    // Check if there are local chats to migrate
    hasLocalChats().then((has) => {
      setHasChats(has)
    })
  }, [user])

  const handleMigrate = async () => {
    setMigrating(true)
    setResult(null)

    try {
      const migrationResult = await migrateIndexedDBToSupabase()
      setResult(migrationResult)

      if (migrationResult.success > 0) {
        toast.success(`Successfully migrated ${migrationResult.success} chat${migrationResult.success > 1 ? 's' : ''}!`)
      }

      if (migrationResult.failed > 0) {
        toast.error(`Failed to migrate ${migrationResult.failed} chat${migrationResult.failed > 1 ? 's' : ''}`)
      }

      if (migrationResult.skipped > 0) {
        toast.info(`Skipped ${migrationResult.skipped} chat${migrationResult.skipped > 1 ? 's' : ''} (already migrated)`)
      }
    } catch (error: any) {
      toast.error(error.message)
      setResult({
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [error.message],
        totalChats: 0,
      })
    } finally {
      setMigrating(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('migration-banner-dismissed', 'true')
  }

  // Don't show banner if:
  // - User is not logged in
  // - No local chats exist
  // - Banner was dismissed
  // - Migration completed successfully
  if (!user || !hasChats || dismissed || (result && result.failed === 0 && result.success > 0)) {
    return null
  }

  return (
    <div className="bg-bolt-elements-background-depth-2 border-l-4 border-bolt-elements-button-primary-background p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-bolt-elements-button-primary-background" />
            <h3 className="font-semibold text-bolt-elements-textPrimary">Local chat history detected</h3>
          </div>
          <p className="text-sm text-bolt-elements-textSecondary mb-3">
            Migrate your local chat history to the cloud for multi-device access and better persistence.
          </p>

          {result && (
            <div className="mb-3 p-3 rounded bg-bolt-elements-background-depth-1 text-sm">
              <div className="font-semibold text-bolt-elements-textPrimary mb-1">Migration Results:</div>
              <div className="space-y-1 text-bolt-elements-textSecondary">
                <div>✓ Successfully migrated: {result.success}</div>
                {result.skipped > 0 && <div>⊘ Skipped (already migrated): {result.skipped}</div>}
                {result.failed > 0 && (
                  <div className="text-bolt-elements-button-danger-text">✗ Failed: {result.failed}</div>
                )}
              </div>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-bolt-elements-button-danger-text">
                    View errors
                  </summary>
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    {result.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="btn btn-sm text-sm h-[34px] bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Migrate Now
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            disabled={migrating}
            className="btn btn-sm text-sm h-[34px] text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary disabled:opacity-50"
            title="Dismiss this banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

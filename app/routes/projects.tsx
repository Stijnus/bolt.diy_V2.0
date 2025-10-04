import { useState } from 'react'
import { ProjectsList } from '~/components/projects/ProjectsList'
import { CreateProjectDialog } from '~/components/projects/CreateProjectDialog'
import { useAuth } from '~/lib/contexts/AuthContext'
import { ClientOnly } from 'remix-utils/client-only'

export default function ProjectsPage() {
  const { user, loading } = useAuth()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bolt-elements-background-depth-1">
        <div className="i-ph:spinner animate-spin text-4xl text-bolt-elements-textSecondary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bolt-elements-background-depth-1 p-4">
        <div className="i-ph:lock-key-duotone text-6xl text-bolt-elements-textTertiary mb-4" />
        <h1 className="text-2xl font-bold text-bolt-elements-textPrimary mb-2">Sign In Required</h1>
        <p className="text-bolt-elements-textSecondary text-center mb-6">
          You need to be signed in to view and manage your projects.
        </p>
        <a
          href="/"
          className="btn bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover"
        >
          Go to Home
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bolt-elements-background-depth-1">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-bolt-elements-borderColor">
          <div>
            <h1 className="text-2xl font-bold text-bolt-elements-textPrimary">My Projects</h1>
            <p className="text-sm text-bolt-elements-textSecondary mt-1">
              Manage your AI-generated projects
            </p>
          </div>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="btn bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover"
          >
            <div className="i-ph:plus" />
            New Project
          </button>
        </div>

        <ClientOnly>
          {() => (
            <>
              <ProjectsList key={refreshKey} />
              <CreateProjectDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onCreated={() => {
                  setRefreshKey(prev => prev + 1)
                }}
              />
            </>
          )}
        </ClientOnly>
      </div>
    </div>
  )
}

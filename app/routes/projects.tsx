import { ArrowLeft, KeyRound, Loader2, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { CreateProjectDialog } from '~/components/projects/CreateProjectDialog';
import { ProjectsList } from '~/components/projects/ProjectsList';
import { Menu } from '~/components/sidebar/Menu.client';
import { Button } from '~/components/ui/Button';
import { useAuth } from '~/lib/contexts/AuthContext';

export default function ProjectsPage() {
  const { user, loading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bolt-elements-background-depth-1">
        <div className="flex items-center gap-3 rounded-2xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-bolt-elements-textSecondary" />
          <span className="text-sm font-medium text-bolt-elements-textPrimary">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2 p-4">
        <div className="relative overflow-hidden rounded-3xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-8 shadow-2xl sm:p-12">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-bolt-elements-button-primary-background/10 blur-3xl"></div>
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-bolt-elements-button-primary-background/5 blur-2xl"></div>

          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-bolt-elements-button-primary-background to-bolt-elements-button-primary-backgroundHover shadow-lg shadow-bolt-elements-button-primary-background/20">
              <KeyRound className="h-10 w-10 text-bolt-elements-button-primary-text" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-bolt-elements-textPrimary sm:text-3xl">
              Sign in to access projects
            </h1>
            <p className="mb-8 max-w-md text-sm text-bolt-elements-textSecondary sm:text-base">
              Sign in to view and manage your AI-powered projects, collaborate with your team, and sync across devices.
            </p>
            <Button asChild size="lg" className="shadow-md">
              <a href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                Go to Home
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2">
      <ClientOnly>{() => <Menu />}</ClientOnly>
      <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1/95 px-6 py-5 backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-bolt-elements-textPrimary sm:text-3xl">My Projects</h1>
                  <div className="flex items-center gap-2 rounded-full border border-bolt-elements-borderColor/60 bg-bolt-elements-background-depth-2 px-3 py-1 text-xs font-medium text-bolt-elements-textSecondary">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI-Powered
                  </div>
                </div>
                <p className="mt-2 text-sm text-bolt-elements-textSecondary">
                  Manage your AI-generated projects and collaborate with your team
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="shadow-sm">
                <Plus className="h-5 w-5" />
                New Project
              </Button>
            </div>
          </div>

          {/* Content */}
          <ClientOnly>
            {() => (
              <>
                <ProjectsList refreshTrigger={refreshTrigger} />
                <CreateProjectDialog
                  open={createDialogOpen}
                  onClose={() => setCreateDialogOpen(false)}
                  onCreated={() => {
                    setRefreshTrigger((prev) => prev + 1);
                  }}
                />
              </>
            )}
          </ClientOnly>
      </div>
    </div>
  );
}

import { useParams } from '@remix-run/react';
import { Loader2 } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { ClientOnly } from 'remix-utils/client-only';

import { ProjectDetailPage } from '~/components/projects/ProjectDetailPage';
import { Menu } from '~/components/sidebar/Menu.client';
import { Button } from '~/components/ui/Button';
import { useAuth } from '~/lib/contexts/AuthContext';

export default function ProjectDetailRoute() {
  const { user, loading } = useAuth();
  const params = useParams();
  const projectId = params.id;

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
          <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-bolt-elements-button-primary-background/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-bolt-elements-button-primary-background/5 blur-2xl" />

          <div className="relative text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-bolt-elements-button-primary-background to-bolt-elements-button-primary-backgroundHover shadow-lg shadow-bolt-elements-button-primary-background/20">
              <Loader2 className="h-10 w-10 animate-spin text-bolt-elements-button-primary-text" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-bolt-elements-textPrimary sm:text-3xl">
              Sign in to view this project
            </h1>
            <p className="mb-8 max-w-md text-sm text-bolt-elements-textSecondary sm:text-base">
              You need an account to access project details.
            </p>
            <Button asChild size="lg" className="shadow-md">
              <a href="/projects" className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                Back to Projects
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center bg-bolt-elements-background-depth-1">
        <Button asChild className="gap-2" size="lg">
          <a href="/projects">
            <ArrowLeft className="h-5 w-5" />
            Back to Projects
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-bolt-elements-background-depth-1 to-bolt-elements-background-depth-2">
      <ClientOnly>{() => <Menu />}</ClientOnly>
      <ClientOnly>{() => <ProjectDetailPage projectId={projectId} />}</ClientOnly>
    </div>
  );
}

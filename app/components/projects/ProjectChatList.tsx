import { useStore } from '@nanostores/react';
import { useNavigate } from '@remix-run/react';
import { MessageSquare, Clock, Plus, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '~/components/ui/Badge';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Separator } from '~/components/ui/Separator';
import { useAuth } from '~/lib/contexts/AuthContext';
import { getCurrentProject } from '~/lib/stores/project';
import { workbenchStore } from '~/lib/stores/workbench';
import { createClient } from '~/lib/supabase/client';
import { cn } from '~/lib/utils';

interface ChatSummary {
  id: string;
  url_id: string;
  description: string | null;
  updated_at: string;
  message_count?: number;
}

export function ProjectChatList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const currentProject = getCurrentProject();
  const currentProjectId = useStore(workbenchStore.currentProjectId);

  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentProjectId || !user) {
      setChats([]);
      setLoading(false);

      return;
    }

    loadChats();
  }, [currentProjectId, user]);

  const loadChats = async () => {
    if (!currentProjectId || !user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data, error: fetchError } = await supabase
        .from('chats')
        .select('id, url_id, description, updated_at')
        .eq('project_id', currentProjectId)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (fetchError) {
        throw fetchError;
      }

      setChats((data as ChatSummary[]) || []);
    } catch (err: any) {
      console.error('Failed to load project chats:', err);
      setError(err.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chat: ChatSummary) => {
    navigate(`/chat/${chat.url_id || chat.id}`);
  };

  const handleNewChat = () => {
    if (!currentProjectId) {
      return;
    }

    navigate(`/?projectId=${currentProjectId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }

    if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    }

    if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }

    if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (!currentProject && !currentProjectId) {
    return null;
  }

  const projectName = currentProject?.name || 'Project';

  return (
    <Card className="border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Project Chats</h3>
          <p className="mt-1 text-sm text-bolt-elements-textSecondary">
            Chat history for <span className="font-medium text-bolt-elements-textPrimary">{projectName}</span>
          </p>
        </div>
        <Button size="sm" onClick={handleNewChat} className="gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Separator className="mb-4" />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-bolt-elements-icon-primary" />
            <span className="text-sm text-bolt-elements-textSecondary">Loading chats...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-10 w-10 text-bolt-elements-button-danger-text" />
            <div>
              <p className="font-medium text-bolt-elements-textPrimary">Failed to load chats</p>
              <p className="mt-1 text-sm text-bolt-elements-textSecondary">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={loadChats}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && chats.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bolt-elements-background-depth-3">
              <MessageSquare className="h-8 w-8 text-bolt-elements-icon-primary" />
            </div>
            <div>
              <p className="font-medium text-bolt-elements-textPrimary">No chats yet</p>
              <p className="mt-1 text-sm text-bolt-elements-textSecondary">
                Start a new chat to begin working on this project
              </p>
            </div>
            <Button size="sm" onClick={handleNewChat} className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              Start First Chat
            </Button>
          </div>
        </div>
      )}

      {/* Chat List */}
      {!loading && !error && chats.length > 0 && (
        <div className="space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleChatClick(chat)}
              className={cn(
                'group w-full rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-4 text-left transition-all',
                'hover:border-bolt-elements-borderColorActive hover:shadow-md hover:-translate-y-0.5',
                'focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive focus:ring-offset-2',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-bolt-elements-icon-primary flex-shrink-0" />
                    <h4 className="truncate font-medium text-bolt-elements-textPrimary group-hover:text-bolt-elements-icon-primary transition-colors">
                      {chat.description || 'Untitled Chat'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(chat.updated_at)}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs text-bolt-elements-textSecondary">
                  Chat
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Show More Button if there are more chats */}
      {!loading && chats.length >= 20 && (
        <div className="mt-4 flex justify-center">
          <Button size="sm" variant="ghost" className="text-sm text-bolt-elements-textSecondary">
            View all chats
          </Button>
        </div>
      )}
    </Card>
  );
}

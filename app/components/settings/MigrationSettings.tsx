import { Database, Cloud, CheckCircle2, XCircle, Loader2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { Button } from '~/components/ui/Button';
import { useAuth } from '~/lib/contexts/AuthContext';
import { getAll, openDatabase } from '~/lib/persistence/db';
import type { ChatHistoryItem } from '~/lib/persistence/useChatHistory';
import { createClient } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('MigrationSettings');

interface ChatMigrationStatus {
  chat: ChatHistoryItem;
  selected: boolean;
  status: 'pending' | 'migrating' | 'success' | 'error';
  error?: string;
}

export function MigrationSettings() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatMigrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    loadLocalChats();
  }, []);

  const loadLocalChats = async () => {
    setLoading(true);

    try {
      const db = await openDatabase();

      if (!db) {
        toast.error('Could not access local database');
        setLoading(false);
        return;
      }

      const localChats = await getAll(db);

      // Check which chats already exist in Supabase
      if (user) {
        const supabase = createClient();
        const { data: existingChats } = await supabase.from('chats').select('url_id').eq('user_id', user.id);

        const existingUrlIds = new Set(existingChats?.map((c: any) => c.url_id) || []);

        const chatStatuses: ChatMigrationStatus[] = localChats.map((chat) => ({
          chat,
          selected: false,
          status: existingUrlIds.has(chat.urlId || chat.id) ? 'success' : 'pending',
        }));

        setChats(chatStatuses);
      } else {
        const chatStatuses: ChatMigrationStatus[] = localChats.map((chat) => ({
          chat,
          selected: false,
          status: 'pending',
        }));

        setChats(chatStatuses);
      }
    } catch (error) {
      logger.error('Failed to load local chats:', error);
      toast.error('Failed to load local chats');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setChats(
      chats.map((chat) => ({
        ...chat,
        selected: chat.status === 'pending' ? newSelectAll : chat.selected,
      })),
    );
  };

  const toggleChatSelection = (index: number) => {
    setChats(
      chats.map((chat, i) =>
        i === index && chat.status === 'pending' ? { ...chat, selected: !chat.selected } : chat,
      ),
    );
  };

  const migrateSelected = async () => {
    if (!user) {
      toast.error('You must be logged in to migrate chats');
      return;
    }

    const selectedChats = chats.filter((c) => c.selected);

    if (selectedChats.length === 0) {
      toast.info('Please select at least one chat to migrate');
      return;
    }

    setMigrating(true);

    const supabase = createClient();
    let successCount = 0;
    let errorCount = 0;

    for (const chatStatus of selectedChats) {
      const index = chats.indexOf(chatStatus);

      // Update status to migrating
      setChats((prev) =>
        prev.map((c, i) => (i === index ? { ...c, status: 'migrating' as const } : c)),
      );

      try {
        const { chat } = chatStatus;
        const urlId = chat.urlId || chat.id;

        const { error } = await supabase.from('chats').insert({
          user_id: user.id,
          url_id: urlId,
          description: chat.description || null,
          messages: chat.messages as any,
        });

        if (error) {
          throw error;
        }

        // Success
        setChats((prev) =>
          prev.map((c, i) =>
            i === index ? { ...c, status: 'success' as const, selected: false } : c,
          ),
        );
        successCount++;
      } catch (error: any) {
        logger.error(`Failed to migrate chat ${chatStatus.chat.id}:`, error);

        setChats((prev) =>
          prev.map((c, i) =>
            i === index
              ? { ...c, status: 'error' as const, error: error.message, selected: false }
              : c,
          ),
        );
        errorCount++;
      }
    }

    setMigrating(false);

    if (successCount > 0) {
      toast.success(`Successfully migrated ${successCount} chat${successCount > 1 ? 's' : ''}!`);
    }

    if (errorCount > 0) {
      toast.error(`Failed to migrate ${errorCount} chat${errorCount > 1 ? 's' : ''}`);
    }
  };

  const selectedCount = chats.filter((c) => c.selected).length;
  const pendingChats = chats.filter((c) => c.status === 'pending');
  const migratedChats = chats.filter((c) => c.status === 'success');

  if (!user) {
    return (
      <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-bolt-elements-textTertiary" />
          <h3 className="mt-4 text-base font-semibold text-bolt-elements-textPrimary">
            Sign in to migrate chats
          </h3>
          <p className="mt-2 text-sm text-bolt-elements-textSecondary">
            You must be logged in to migrate your local chats to the cloud.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-bolt-elements-textSecondary" />
          <span className="text-sm text-bolt-elements-textSecondary">Loading local chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-bolt-elements-textSecondary" />
            <span className="text-xs text-bolt-elements-textSecondary">Local</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-bolt-elements-textPrimary">{chats.length}</div>
        </div>
        <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-green-500" />
            <span className="text-xs text-bolt-elements-textSecondary">Migrated</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-green-500">{migratedChats.length}</div>
        </div>
        <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-bolt-elements-textSecondary">Pending</span>
          </div>
          <div className="mt-1 text-2xl font-bold text-yellow-500">{pendingChats.length}</div>
        </div>
      </div>

      {/* Actions */}
      {pendingChats.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-button-primary-background focus:ring-2 focus:ring-bolt-elements-button-primary-background"
            />
            <span className="text-sm text-bolt-elements-textPrimary">
              {selectedCount > 0 ? `${selectedCount} selected` : 'Select all pending'}
            </span>
          </div>
          <Button onClick={migrateSelected} disabled={selectedCount === 0 || migrating} size="sm">
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Migrate Selected
              </>
            )}
          </Button>
        </div>
      )}

      {/* Chat List */}
      <div className="space-y-2">
        {chats.length === 0 ? (
          <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-8 text-center">
            <Database className="mx-auto h-12 w-12 text-bolt-elements-textTertiary" />
            <h3 className="mt-4 text-base font-semibold text-bolt-elements-textPrimary">No local chats found</h3>
            <p className="mt-2 text-sm text-bolt-elements-textSecondary">
              All your chats are already synced to the cloud!
            </p>
          </div>
        ) : (
          chats.map((chatStatus, index) => (
            <div
              key={chatStatus.chat.id}
              className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                chatStatus.status === 'success'
                  ? 'border-green-500/20 bg-green-500/5'
                  : chatStatus.status === 'error'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3'
              }`}
            >
              {chatStatus.status === 'pending' && (
                <input
                  type="checkbox"
                  checked={chatStatus.selected}
                  onChange={() => toggleChatSelection(index)}
                  className="h-4 w-4 rounded border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 text-bolt-elements-button-primary-background focus:ring-2 focus:ring-bolt-elements-button-primary-background"
                />
              )}

              <div className="flex-1 min-w-0">
                <h4 className="truncate text-sm font-medium text-bolt-elements-textPrimary">
                  {chatStatus.chat.description || chatStatus.chat.urlId || chatStatus.chat.id}
                </h4>
                <p className="text-xs text-bolt-elements-textSecondary">
                  {chatStatus.chat.messages.length} message{chatStatus.chat.messages.length !== 1 ? 's' : ''} •{' '}
                  {new Date(chatStatus.chat.timestamp).toLocaleDateString()}
                </p>
                {chatStatus.error && (
                  <p className="mt-1 text-xs text-red-500">{chatStatus.error}</p>
                )}
              </div>

              <div className="flex-shrink-0">
                {chatStatus.status === 'migrating' && (
                  <Loader2 className="h-5 w-5 animate-spin text-bolt-elements-textSecondary" />
                )}
                {chatStatus.status === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {chatStatus.status === 'error' && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

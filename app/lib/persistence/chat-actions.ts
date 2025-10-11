import type { UIMessage } from 'ai';
import { toast } from 'react-toastify';
import { getMessages, setMessages, openDatabase, generateChatId } from './db';
import type { ChatHistoryItem } from './useChatHistory';
import { setSyncing, setConnectionError } from '~/lib/stores/connection';
import { createClient } from '~/lib/supabase/client';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('ChatActions');

/**
 * Export a chat to JSON format
 */
export async function exportChatToJSON(chatId: string): Promise<void> {
  try {
    const database = await openDatabase();

    if (!database) {
      toast.error('Chat persistence is unavailable');
      return;
    }

    const chatHistory = await getMessages(database, chatId);

    if (!chatHistory || !chatHistory.messages || chatHistory.messages.length === 0) {
      toast.error('Chat not found or empty');
      return;
    }

    // Create export data with all relevant information
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      chat: {
        id: chatHistory.id,
        urlId: chatHistory.urlId,
        description: chatHistory.description || 'Exported Chat',
        messages: chatHistory.messages,
        model: chatHistory.model,
        timestamp: chatHistory.timestamp,
        fileState: chatHistory.fileState,
        terminalState: chatHistory.terminalState,
        workbenchState: chatHistory.workbenchState,
        editorState: chatHistory.editorState,
      },
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    // Generate filename from description and date
    const sanitizedDescription = (chatHistory.description || 'chat')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50);

    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `chat-${sanitizedDescription}-${dateStr}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Chat exported successfully');
    logger.info(`Chat ${chatId} exported successfully`);
  } catch (error) {
    logger.error('Failed to export chat:', error);
    toast.error('Failed to export chat');
  }
}

/**
 * Import a chat from JSON format
 */
export async function importChatFromJSON(
  jsonData: string,
  userId?: string,
): Promise<{ success: boolean; chatId?: string }> {
  try {
    const database = await openDatabase();

    if (!database) {
      toast.error('Chat persistence is unavailable');
      return { success: false };
    }

    // Parse JSON data
    const importData = JSON.parse(jsonData);

    // Validate import data structure
    if (!importData.chat || !importData.chat.messages || !Array.isArray(importData.chat.messages)) {
      throw new Error('Invalid chat export format');
    }

    if (importData.chat.messages.length === 0) {
      throw new Error('Chat export contains no messages');
    }

    // Generate new chat ID to avoid conflicts
    const newChatId = generateChatId();
    const newUrlId = newChatId; // Use same ID for urlId

    const chat = importData.chat;

    // Prepare chat data for storage
    const messages = chat.messages as UIMessage[];
    const description = chat.description || 'Imported Chat';
    const model = chat.model;
    const fileState = chat.fileState;
    const terminalState = chat.terminalState;
    const workbenchState = chat.workbenchState;
    const editorState = chat.editorState;

    // Save to IndexedDB
    await setMessages(
      database,
      newChatId,
      messages,
      newUrlId,
      description,
      model,
      new Date().toISOString(),
      'local',
      fileState,
      terminalState,
      workbenchState,
      editorState,
    );

    // If user is authenticated, also save to Supabase
    if (userId) {
      try {
        setSyncing(true);
        setConnectionError(null);

        const supabase = createClient();

        const { error } = await supabase.from('chats').upsert(
          {
            url_id: newUrlId,
            user_id: userId,
            messages: messages as any,
            description,
            model,
            file_state: fileState,
            terminal_state: terminalState,
            workbench_state: workbenchState,
            editor_state: editorState,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'url_id,user_id',
          },
        );

        if (error) {
          logger.error('Failed to sync imported chat to Supabase:', error);
          toast.warning('Chat imported locally but failed to sync to cloud');
        } else {
          logger.info(`Imported chat ${newChatId} synced to Supabase`);
        }
      } catch (error) {
        logger.error('Error syncing imported chat to Supabase:', error);
      } finally {
        setSyncing(false);
      }
    }

    toast.success('Chat imported successfully');
    logger.info(`Chat imported with ID ${newChatId}`);

    return { success: true, chatId: newUrlId };
  } catch (error) {
    logger.error('Failed to import chat:', error);
    toast.error(`Failed to import chat: ${(error as Error).message}`);

    return { success: false };
  }
}

/**
 * Rename a chat's description
 */
export async function renameChatDescription(chatId: string, newDescription: string, userId?: string): Promise<boolean> {
  try {
    // Validate input
    if (!newDescription || newDescription.trim().length === 0) {
      toast.error('Description cannot be empty');
      return false;
    }

    if (newDescription.length > 100) {
      toast.error('Description is too long (max 100 characters)');
      return false;
    }

    const trimmedDescription = newDescription.trim();

    const database = await openDatabase();

    if (!database) {
      toast.error('Chat persistence is unavailable');
      return false;
    }

    // Get current chat data
    const chatHistory = await getMessages(database, chatId);

    if (!chatHistory) {
      toast.error('Chat not found');
      return false;
    }

    // Update in IndexedDB
    await setMessages(
      database,
      chatHistory.id,
      chatHistory.messages,
      chatHistory.urlId,
      trimmedDescription,
      chatHistory.model,
      new Date().toISOString(),
      chatHistory.origin || 'local',
      chatHistory.fileState,
      chatHistory.terminalState,
      chatHistory.workbenchState,
      chatHistory.editorState,
    );

    // If user is authenticated and chat is from remote, update in Supabase
    if (userId && chatHistory.urlId) {
      try {
        setSyncing(true);
        setConnectionError(null);

        const supabase = createClient();

        const { error } = await supabase
          .from('chats')
          .update({
            description: trimmedDescription,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('url_id', chatHistory.urlId);

        if (error) {
          logger.error('Failed to update chat description in Supabase:', error);
          toast.warning('Chat renamed locally but failed to sync to cloud');
        } else {
          logger.info(`Chat ${chatId} renamed in Supabase`);
        }
      } catch (error) {
        logger.error('Error updating chat description in Supabase:', error);
      } finally {
        setSyncing(false);
      }
    }

    toast.success('Chat renamed successfully');
    logger.info(`Chat ${chatId} renamed to "${trimmedDescription}"`);

    return true;
  } catch (error) {
    logger.error('Failed to rename chat:', error);
    toast.error('Failed to rename chat');

    return false;
  }
}

/**
 * Duplicate a chat (create a copy with new ID)
 */
export async function duplicateChat(chatId: string, userId?: string): Promise<{ success: boolean; chatId?: string }> {
  try {
    const database = await openDatabase();

    if (!database) {
      toast.error('Chat persistence is unavailable');
      return { success: false };
    }

    // Get original chat data
    const originalChat = await getMessages(database, chatId);

    if (!originalChat || !originalChat.messages || originalChat.messages.length === 0) {
      toast.error('Chat not found or empty');
      return { success: false };
    }

    // Generate new chat ID
    const newChatId = generateChatId();
    const newUrlId = newChatId;

    // Create duplicate with new description
    const newDescription = `${originalChat.description || 'Chat'} (Copy)`;

    // Save duplicate to IndexedDB
    await setMessages(
      database,
      newChatId,
      originalChat.messages,
      newUrlId,
      newDescription,
      originalChat.model,
      new Date().toISOString(),
      'local',
      originalChat.fileState,
      originalChat.terminalState,
      originalChat.workbenchState,
      originalChat.editorState,
    );

    // If user is authenticated, also save to Supabase
    if (userId) {
      try {
        setSyncing(true);
        setConnectionError(null);

        const supabase = createClient();

        const { error } = await supabase.from('chats').upsert(
          {
            url_id: newUrlId,
            user_id: userId,
            messages: originalChat.messages as any,
            description: newDescription,
            model: originalChat.model,
            file_state: originalChat.fileState,
            terminal_state: originalChat.terminalState,
            workbench_state: originalChat.workbenchState,
            editor_state: originalChat.editorState,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'url_id,user_id',
          },
        );

        if (error) {
          logger.error('Failed to sync duplicated chat to Supabase:', error);
          toast.warning('Chat duplicated locally but failed to sync to cloud');
        } else {
          logger.info(`Duplicated chat ${newChatId} synced to Supabase`);
        }
      } catch (error) {
        logger.error('Error syncing duplicated chat to Supabase:', error);
      } finally {
        setSyncing(false);
      }
    }

    toast.success('Chat duplicated successfully');
    logger.info(`Chat ${chatId} duplicated to ${newChatId}`);

    return { success: true, chatId: newUrlId };
  } catch (error) {
    logger.error('Failed to duplicate chat:', error);
    toast.error('Failed to duplicate chat');

    return { success: false };
  }
}

/**
 * Revert messages in a chat (remove all messages after a specific index)
 */
export async function revertMessagesToIndex(chatId: string, messageIndex: number, userId?: string): Promise<boolean> {
  try {
    const database = await openDatabase();

    if (!database) {
      toast.error('Chat persistence is unavailable');
      return false;
    }

    // Get current chat data
    const chatHistory = await getMessages(database, chatId);

    if (!chatHistory || !chatHistory.messages) {
      toast.error('Chat not found');
      return false;
    }

    // Validate index
    if (messageIndex < 0 || messageIndex >= chatHistory.messages.length) {
      toast.error('Invalid message index');
      return false;
    }

    // Create new message array with only messages up to the index (inclusive)
    const revertedMessages = chatHistory.messages.slice(0, messageIndex + 1);

    if (revertedMessages.length === 0) {
      toast.error('Cannot revert to empty chat');
      return false;
    }

    // Update in IndexedDB
    await setMessages(
      database,
      chatHistory.id,
      revertedMessages,
      chatHistory.urlId,
      chatHistory.description,
      chatHistory.model,
      new Date().toISOString(),
      chatHistory.origin || 'local',
      chatHistory.fileState,
      chatHistory.terminalState,
      chatHistory.workbenchState,
      chatHistory.editorState,
    );

    // If user is authenticated, update in Supabase
    if (userId && chatHistory.urlId) {
      try {
        setSyncing(true);
        setConnectionError(null);

        const supabase = createClient();

        const { error } = await supabase
          .from('chats')
          .update({
            messages: revertedMessages as any,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('url_id', chatHistory.urlId);

        if (error) {
          logger.error('Failed to sync reverted messages to Supabase:', error);
          toast.warning('Messages reverted locally but failed to sync to cloud');
        } else {
          logger.info(`Chat ${chatId} messages reverted in Supabase`);
        }
      } catch (error) {
        logger.error('Error syncing reverted messages to Supabase:', error);
      } finally {
        setSyncing(false);
      }
    }

    const removedCount = chatHistory.messages.length - revertedMessages.length;
    toast.success(`Reverted ${removedCount} message${removedCount === 1 ? '' : 's'}`);
    logger.info(`Chat ${chatId} reverted to message index ${messageIndex}`);

    return true;
  } catch (error) {
    logger.error('Failed to revert messages:', error);
    toast.error('Failed to revert messages');

    return false;
  }
}

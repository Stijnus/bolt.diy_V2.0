import { useStore } from '@nanostores/react';
import React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { AiAssistantTab } from './tabs/AIAssistantTab';
import { AccountTab } from './tabs/AccountTab';
import { EditorTab } from './tabs/EditorTab';
import { PreferencesTab } from './tabs/PreferencesTab';
import { ProfileTab } from './tabs/ProfileTab';
import { UsageTab } from './tabs/UsageTab';
import { Button } from '~/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/Tabs';
import { useAuth } from '~/lib/contexts/AuthContext';
import {
  settingsStore,
  updateEditorSettings,
  updateAISettings,
  updateUserPreferences,
  type EditorSettings,
  type AISettings,
  type UserPreferences,
} from '~/lib/stores/settings';
import { supabase } from '~/lib/supabase/client';
import { getAvatarUrl } from '~/utils/avatar';
import { classNames } from '~/utils/classNames';

export function SettingsContent({ showBackButton = false }: { showBackButton?: boolean }) {
  const { user, updateUser, deleteAccount } = useAuth();
  const settings = useStore(settingsStore);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialSettings, setInitialSettings] = useState(settings);
  const [avatarUrl, setAvatarUrl] = useState(user ? getAvatarUrl(user) : '');

  const handleEditorSettingChange = (key: keyof EditorSettings, value: any) => {
    updateEditorSettings({ [key]: value });
    setHasUnsavedChanges(true);
  };

  const handleAISettingChange = (key: keyof AISettings, value: any) => {
    updateAISettings({ [key]: value });
    setHasUnsavedChanges(true);
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    updateUserPreferences({ [key]: value });
    setHasUnsavedChanges(true);
  };

  // Track changes and warn before leaving
  useEffect(() => {
    const checkForChanges = () => {
      const changed =
        JSON.stringify(settings.editor) !== JSON.stringify(initialSettings.editor) ||
        JSON.stringify(settings.ai) !== JSON.stringify(initialSettings.ai) ||
        JSON.stringify(settings.preferences) !== JSON.stringify(initialSettings.preferences) ||
        displayName !== (user?.user_metadata?.name || '');

      setHasUnsavedChanges(changed);
    };

    checkForChanges();
  }, [settings, displayName, user, initialSettings]);

  // Warn before closing browser
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const resetEditorSettings = () => {
    updateEditorSettings({
      tabSize: 2,
      fontSize: 14,
      lineHeight: 1.5,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
    });
    toast.success('Editor settings reset to defaults');
  };

  const resetAISettings = () => {
    updateAISettings({
      temperature: 0.7,
      maxTokens: 8192,
      streamResponse: true,
      defaultModel: 'anthropic:claude-sonnet-4-5-20250929',
      planModel: 'anthropic:claude-sonnet-4-5-20250929',
    });
    toast.success('AI settings reset to defaults');
  };

  const resetPreferences = () => {
    updateUserPreferences({
      notifications: true,
      autoSave: true,
      autoSaveDelay: 1000,
    });
    toast.success('Preferences reset to defaults');
  };

  const exportSettings = () => {
    const settingsData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      settings: {
        editor: settings.editor,
        ai: settings.ai,
        preferences: settings.preferences,
      },
    };

    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boltdiy-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully');
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];

      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.settings) {
          throw new Error('Invalid settings file format');
        }

        if (data.settings.editor) {
          updateEditorSettings(data.settings.editor);
        }

        if (data.settings.ai) {
          updateAISettings(data.settings.ai);
        }

        if (data.settings.preferences) {
          updateUserPreferences(data.settings.preferences);
        }

        toast.success('Settings imported successfully');
      } catch (error) {
        toast.error('Failed to import settings. Please check the file format.');
        console.error('Error importing settings:', error);
      }
    };
    input.click();
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // Save profile changes if display name has changed
      if (user && displayName !== (user.user_metadata?.name || '')) {
        await updateUser({ name: displayName });
      }

      if (user) {
        // Authenticated: Save to database (and client store already updated)
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              editor: settings.editor,
              ai: settings.ai,
              preferences: settings.preferences,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Settings save failed:', response.status, errorText);
          throw new Error(`Failed to save settings to database (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        console.log('Settings saved to database:', result);
      } else {
        // Guest: Persist to IndexedDB
        const { getDatabase, setAppSettings } = await import('~/lib/persistence/db');
        const db = await getDatabase();
        if (!db) throw new Error('IndexedDB unavailable');
        await setAppSettings(db, {
          editor: settings.editor,
          ai: settings.ai,
          preferences: settings.preferences,
        });
        console.log('Settings saved to IndexedDB');
      }

      // Reset unsaved changes tracking after successful save
      setInitialSettings(settings);
      setHasUnsavedChanges(false);

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        throw error;
      }

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to change password');
      console.error('Error changing password:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      await deleteAccount();
      toast.success('Account deleted successfully');

      // Redirect to home or login page would happen automatically due to auth state change
    } catch (error) {
      toast.error('Failed to delete account');
      console.error('Error deleting account:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAvatarUpdate = (newUrl: string) => {
    setAvatarUrl(newUrl);
  };

  const tabSections: { value: string; label: string; content: React.ReactElement }[] = [];

  if (user) {
    tabSections.push({
      value: 'profile',
      label: 'Profile',
      content: (
        <ProfileTab
          displayName={displayName}
          email={user.email || ''}
          avatarUrl={avatarUrl}
          userId={user.id}
          onDisplayNameChange={setDisplayName}
          onAvatarUpdate={handleAvatarUpdate}
        />
      ),
    });
  }

  tabSections.push(
    {
      value: 'editor',
      label: 'Editor',
      content: (
        <EditorTab
          settings={settings.editor}
          onSettingChange={handleEditorSettingChange}
          onReset={resetEditorSettings}
        />
      ),
    },
    {
      value: 'ai-assistant',
      label: 'AI Assistant',
      content: (
        <AiAssistantTab settings={settings.ai} onSettingChange={handleAISettingChange} onReset={resetAISettings} />
      ),
    },
    {
      value: 'preferences',
      label: 'Preferences',
      content: (
        <PreferencesTab
          preferences={settings.preferences}
          onPreferenceChange={handlePreferenceChange}
          onReset={resetPreferences}
        />
      ),
    },
    { value: 'usage', label: 'Usage', content: <UsageTab /> },
    {
      value: 'account',
      label: 'Account',
      content: (
        <AccountTab
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          isChangingPassword={isChangingPassword}
          showDeleteConfirm={showDeleteConfirm}
          isDeleting={isDeleting}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onChangePassword={handleChangePassword}
          onDeleteAccount={handleDeleteAccount}
          onShowDeleteConfirm={setShowDeleteConfirm}
        />
      ),
    },
  );

  const defaultTab = tabSections[0]?.value ?? 'editor';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-1/95 px-6 py-4">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <a
              href="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-bolt-elements-textSecondary transition-colors hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary"
            >
              ← Back
            </a>
          )}
          <h1 className="text-xl font-bold text-bolt-elements-textPrimary">Settings</h1>
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-bolt-elements-warning-background px-3 py-1 text-xs font-medium text-bolt-elements-warning-text border border-bolt-elements-warning-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bolt-elements-warning-text opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-bolt-elements-warning-text"></span>
              </span>
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportSettings} size="sm">
            Export
          </Button>
          <Button variant="secondary" onClick={importSettings} size="sm">
            Import
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={classNames(
              hasUnsavedChanges
                ? 'ring-2 ring-bolt-elements-button-primary-background ring-offset-2 ring-offset-bolt-elements-background-depth-1'
                : '',
            )}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Implementation Status Notice */}
          <div className="mb-6 rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-4 transition-theme animate-scaleIn hover:border-bolt-elements-borderColorActive">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-bolt-elements-textSecondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-bolt-elements-textPrimary">Settings Implementation Status</h3>
                <p className="mt-1 text-sm text-bolt-elements-textSecondary">
                  The settings UI is complete and functional. Settings marked as "Coming Soon" are saved to your session
                  but not yet connected to the application features. Settings marked as "Partial" have limited
                  functionality. We're actively working on connecting all settings to their respective features.
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="w-full justify-start gap-1 rounded-[calc(var(--radius))] border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/60 p-1 text-bolt-elements-textSecondary transition-theme">
              {tabSections.map((section) => (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className="rounded-[calc(var(--radius))] px-3 py-2 text-sm font-medium text-bolt-elements-textSecondary transition-theme data-[state=active]:bg-bolt-elements-background-depth-1 data-[state=active]:text-bolt-elements-textPrimary"
                >
                  {section.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabSections.map((section) => (
              <TabsContent key={section.value} value={section.value} className="mt-6">
                {section.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

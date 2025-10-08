import { useStore } from '@nanostores/react';
import React from 'react';
import { useState } from 'react';
import { toast } from 'react-toastify';

import { MigrationSettings } from './MigrationSettings';
import { SettingItem } from './SettingItem';
import { SettingsSection } from './SettingsSection';
import { UsageDashboard } from './UsageDashboard';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Switch } from '~/components/ui/Switch';
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
import { getAvatarUrl } from '~/utils/avatar';

export function SettingsContent({ showBackButton = false }: { showBackButton?: boolean }) {
  const { user, updateUser, deleteAccount } = useAuth();
  const settings = useStore(settingsStore);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditorSettingChange = (key: keyof EditorSettings, value: any) => {
    updateEditorSettings({ [key]: value });
  };

  const handleAISettingChange = (key: keyof AISettings, value: any) => {
    updateAISettings({ [key]: value });
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    updateUserPreferences({ [key]: value });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);

    try {
      // Save profile changes if display name has changed
      if (user && displayName !== (user.user_metadata?.name || '')) {
        await updateUser({ name: displayName });
      }

      // Save application settings to database
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
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

  const profileSection = user && (
    <SettingsSection title="Profile" description="Manage your account information" status="implemented">
      <div className="rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-6">
        <div className="flex items-center gap-4 mb-6">
          <img
            src={getAvatarUrl(user)}
            alt={user.email || 'User'}
            className="h-16 w-16 rounded-full ring-2 ring-bolt-elements-borderColor"
          />
          <div className="flex-1">
            <h3 className="text-base font-semibold text-bolt-elements-textPrimary">
              {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
            </h3>
            <p className="text-sm text-bolt-elements-textSecondary">{user.email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <SettingItem label="Display Name" description="Your name as it appears in the application">
            <Input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full max-w-xs"
            />
          </SettingItem>
          <SettingItem label="Email Address" description="Your email address (cannot be changed here)">
            <Input type="email" value={user.email || ''} disabled className="w-full max-w-xs" />
          </SettingItem>
        </div>
      </div>
    </SettingsSection>
  );

  const editorSection = (
    <SettingsSection title="Editor" description="Customize your code editor preferences" status="coming-soon">
      <SettingItem
        label="Tab Size"
        description="Number of spaces per tab"
        tooltip="Controls how many spaces are inserted when you press the Tab key. Common values are 2 or 4 spaces."
      >
        <Input
          type="number"
          min={2}
          max={8}
          value={settings.editor.tabSize}
          onChange={(e) => handleEditorSettingChange('tabSize', parseInt(e.target.value, 10))}
          className="w-20"
        />
      </SettingItem>
      <SettingItem
        label="Font Size"
        description="Editor font size in pixels"
        tooltip="Adjusts the size of text in the code editor. Larger values make text easier to read, smaller values fit more code on screen."
      >
        <Input
          type="number"
          min={10}
          max={24}
          value={settings.editor.fontSize}
          onChange={(e) => handleEditorSettingChange('fontSize', parseInt(e.target.value, 10))}
          className="w-20"
        />
      </SettingItem>
      <SettingItem
        label="Line Height"
        description="Line height multiplier"
        tooltip="Controls the vertical spacing between lines of code. Higher values (1.5-2.0) improve readability, lower values (1.0-1.3) fit more code on screen."
      >
        <Input
          type="number"
          min={1}
          max={2}
          step={0.1}
          value={settings.editor.lineHeight}
          onChange={(e) => handleEditorSettingChange('lineHeight', parseFloat(e.target.value))}
          className="w-20"
        />
      </SettingItem>
      <SettingItem
        label="Word Wrap"
        description="Wrap long lines"
        tooltip="When enabled, long lines of code will automatically wrap to the next line instead of requiring horizontal scrolling."
      >
        <Switch
          checked={settings.editor.wordWrap}
          onChange={(checked) => handleEditorSettingChange('wordWrap', checked)}
        />
      </SettingItem>
      <SettingItem
        label="Minimap"
        description="Show code minimap"
        tooltip="Displays a small overview of your entire file on the right side of the editor, making it easier to navigate large files."
      >
        <Switch
          checked={settings.editor.minimap}
          onChange={(checked) => handleEditorSettingChange('minimap', checked)}
        />
      </SettingItem>
      <SettingItem
        label="Line Numbers"
        description="Show line numbers"
        tooltip="Displays line numbers in the left gutter of the editor, useful for referencing specific lines and debugging."
      >
        <Switch
          checked={settings.editor.lineNumbers}
          onChange={(checked) => handleEditorSettingChange('lineNumbers', checked)}
        />
      </SettingItem>
    </SettingsSection>
  );

  const aiSection = (
    <SettingsSection title="AI Assistant" description="Configure AI model and behavior" status="coming-soon">
      <SettingItem
        label="Temperature"
        description="Controls randomness (0-1)"
        tooltip="Lower values (0.0-0.3) make responses more focused and deterministic. Higher values (0.7-1.0) make responses more creative and varied."
      >
        <Input
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={settings.ai.temperature}
          onChange={(e) => handleAISettingChange('temperature', parseFloat(e.target.value))}
          className="w-20"
        />
      </SettingItem>
      <SettingItem
        label="Max Tokens"
        description="Maximum response length"
        tooltip="Limits the length of AI responses. Higher values allow longer responses but use more resources. 1 token ≈ 4 characters."
      >
        <Input
          type="number"
          min={1024}
          max={32768}
          step={1024}
          value={settings.ai.maxTokens}
          onChange={(e) => handleAISettingChange('maxTokens', parseInt(e.target.value, 10))}
          className="w-24"
        />
      </SettingItem>
      <SettingItem
        label="Stream Response"
        description="Stream AI responses in real-time"
        tooltip="When enabled, AI responses appear word-by-word as they're generated. When disabled, the full response appears at once."
      >
        <Switch
          checked={settings.ai.streamResponse}
          onChange={(checked) => handleAISettingChange('streamResponse', checked)}
        />
      </SettingItem>
    </SettingsSection>
  );

  const preferencesSection = (
    <SettingsSection title="Preferences" description="General application settings" status="coming-soon">
      <SettingItem
        label="Notifications"
        description="Enable browser notifications"
        tooltip="Receive desktop notifications for important events and updates. Your browser may ask for permission."
      >
        <Switch
          checked={settings.preferences.notifications}
          onChange={(checked) => handlePreferenceChange('notifications', checked)}
        />
      </SettingItem>
      <SettingItem
        label="Auto Save"
        description="Automatically save changes"
        tooltip="Automatically saves your work as you type. Prevents data loss from browser crashes or accidental closures."
      >
        <Switch
          checked={settings.preferences.autoSave}
          onChange={(checked) => handlePreferenceChange('autoSave', checked)}
        />
      </SettingItem>
      <SettingItem
        label="Auto Save Delay"
        description="Delay before auto-saving (ms)"
        tooltip="Time to wait after you stop typing before auto-save triggers. Lower values save more frequently but may impact performance."
      >
        <Input
          type="number"
          min={500}
          max={5000}
          step={500}
          value={settings.preferences.autoSaveDelay}
          onChange={(e) => handlePreferenceChange('autoSaveDelay', parseInt(e.target.value, 10))}
          className="w-24"
          disabled={!settings.preferences.autoSave}
        />
      </SettingItem>
    </SettingsSection>
  );

  const migrationSection = (
    <SettingsSection
      title="Data Migration"
      description="Migrate your local chats to cloud storage"
      status="implemented"
    >
      <MigrationSettings />
    </SettingsSection>
  );

  const usageSection = (
    <SettingsSection title="Usage" description="View your token usage and estimated costs" status="implemented">
      <UsageDashboard />
    </SettingsSection>
  );

  const accountSection = (
    <SettingsSection title="Account" description="Manage your account" status="implemented">
      <div className="rounded-lg border border-bolt-elements-button-danger-background/20 bg-bolt-elements-button-danger-background/5 p-6">
        <h3 className="mb-2 text-base font-semibold text-bolt-elements-textPrimary">Danger Zone</h3>
        <p className="mb-4 text-sm text-bolt-elements-textSecondary">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-bolt-elements-textSecondary">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );

  const tabSections: { value: string; label: string; content: React.ReactElement }[] = [];

  if (profileSection) {
    tabSections.push({ value: 'profile', label: 'Profile', content: profileSection });
  }

  tabSections.push(
    { value: 'editor', label: 'Editor', content: editorSection },
    { value: 'ai-assistant', label: 'AI Assistant', content: aiSection },
    { value: 'preferences', label: 'Preferences', content: preferencesSection },
    { value: 'usage', label: 'Usage', content: usageSection },
    { value: 'data-migration', label: 'Data Migration', content: migrationSection },
    { value: 'account', label: 'Account', content: accountSection },
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
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Implementation Status Notice */}
          <div className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-500"
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
                <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-500">
                  Settings Implementation Status
                </h3>
                <p className="mt-1 text-xs text-blue-600/80 dark:text-blue-500/80">
                  The settings UI is complete and functional. Settings marked as "Coming Soon" are saved to your session
                  but not yet connected to the application features. Settings marked as "Partial" have limited
                  functionality. We're actively working on connecting all settings to their respective features.
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList className="w-full justify-start gap-1 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2/60 p-1 text-bolt-elements-textSecondary">
              {tabSections.map((section) => (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className="rounded-md px-3 py-2 text-sm font-medium text-bolt-elements-textSecondary transition-colors data-[state=active]:bg-bolt-elements-background-depth-1 data-[state=active]:text-bolt-elements-textPrimary"
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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

import { useSettingsManager } from './useSettingsManager';
import { AiAssistantTab } from './tabs/AIAssistantTab';
import { AccountTab } from './tabs/AccountTab';
import { EditorTab } from './tabs/EditorTab';
import { PreferencesTab } from './tabs/PreferencesTab';
import { ProfileTab } from './tabs/ProfileTab';
import { UsageTab } from './tabs/UsageTab';
import { Button } from '~/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/Tabs';
import { useAuth } from '~/lib/contexts/AuthContext';
import { type AISettings, type EditorSettings, type UserPreferences } from '~/lib/stores/settings';
import { supabase } from '~/lib/supabase/client';
import { getAvatarUrl } from '~/utils/avatar';
import { classNames } from '~/utils/classNames';

export function SettingsContent({ showBackButton = false }: { showBackButton?: boolean }) {
  const { user, updateUser, deleteAccount } = useAuth();
  const {
    draft,
    hasUnsavedChanges: settingsDirty,
    sectionDirtyState,
    groupedErrors,
    updateSection,
    resetSection,
    revertSection,
    getValidatedDraft,
    markSaved,
    importSettings: importDraft,
    getExportPayload,
    persistenceUnavailable,
    setPersistenceUnavailable,
  } = useSettingsManager();
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(user?.user_metadata?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user ? getAvatarUrl(user) : '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setDisplayName(user?.user_metadata?.name || '');
    setAvatarUrl(user ? getAvatarUrl(user) : '');
  }, [user]);

  const canonicalDisplayName = user?.user_metadata?.name || '';
  const trimmedDisplayName = displayName.trim();
  const displayNameError =
    trimmedDisplayName.length === 0
      ? 'Display name is required.'
      : trimmedDisplayName.length > 64
        ? 'Display name must be 64 characters or fewer.'
        : null;
  const displayNameDirty = trimmedDisplayName !== canonicalDisplayName;
  const hasPendingChanges = settingsDirty || displayNameDirty;

  const passwordError = useMemo(() => {
    if (!newPassword && !confirmPassword) {
      return null;
    }

    if (!newPassword || !confirmPassword) {
      return 'Please fill in both password fields.';
    }

    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasLetter || !hasNumber || !hasSymbol) {
      return 'Include letters, numbers, and symbols for a stronger password.';
    }

    if (newPassword !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  }, [newPassword, confirmPassword]);

  const editorErrors = useMemo(() => groupedErrors.editor as Partial<Record<keyof EditorSettings, string>>, [groupedErrors]);
  const aiErrors = useMemo(() => groupedErrors.ai as Partial<Record<keyof AISettings, string>>, [groupedErrors]);
  const preferencesErrors = useMemo(
    () => groupedErrors.preferences as Partial<Record<keyof UserPreferences, string>>,
    [groupedErrors],
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPendingChanges]);

  const handleEditorSettingChange = useCallback(
    <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
      updateSection('editor', { [key]: value });
    },
    [updateSection],
  );

  const handleAISettingChange = useCallback(
    <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
      updateSection('ai', { [key]: value });
    },
    [updateSection],
  );

  const handlePreferenceChange = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      updateSection('preferences', { [key]: value });
    },
    [updateSection],
  );

  const resetEditorSettings = useCallback(() => {
    resetSection('editor');
    toast.success('Editor settings reset to defaults');
  }, [resetSection]);

  const resetAISettings = useCallback(() => {
    resetSection('ai');
    toast.success('AI settings reset to defaults');
  }, [resetSection]);

  const resetPreferences = useCallback(() => {
    resetSection('preferences');
    toast.success('Preferences reset to defaults');
  }, [resetSection]);

  const handleExportSettings = useCallback(() => {
    try {
      const payload = getExportPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boltdiy-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Settings exported successfully');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to export settings. Please fix validation errors first.',
      );
      console.error('Error exporting settings:', error);
    }
  }, [getExportPayload]);

  const handleImportSettings = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importDraft(data);
        toast.success('Settings imported into draft. Review and save to apply.');
      } catch (error) {
        toast.error('Failed to import settings. Please verify the file format.');
        console.error('Error importing settings:', error);
      }
    };

    input.click();
  }, [importDraft]);

  const handleSaveSettings = useCallback(async () => {
    setIsSaving(true);

    let validatedSettings;

    try {
      validatedSettings = getValidatedDraft();
    } catch (error) {
      setIsSaving(false);
      toast.error('Please fix validation errors before saving.');
      console.error('Validation error while saving settings:', error);
      return;
    }

    try {
      if (displayNameError) {
        throw new Error(displayNameError);
      }

      if (user && displayNameDirty) {
        await updateUser({ name: trimmedDisplayName });
      }

      if (user) {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: validatedSettings }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save settings to database (${response.status}): ${errorText}`);
        }

        await response.json();
      } else {
        const { getDatabase, setAppSettings } = await import('~/lib/persistence/db');
        const db = await getDatabase();
        if (!db) {
          throw new Error('IndexedDB unavailable');
        }
        await setAppSettings(db, validatedSettings);
        setPersistenceUnavailable(false);
      }

      markSaved(validatedSettings);
      if (displayNameDirty) {
        setDisplayName(trimmedDisplayName);
      }
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
      console.error('Error saving settings:', error);
      if (error instanceof Error && /indexeddb|database not available/i.test(error.message)) {
        setPersistenceUnavailable(true);
      }
    } finally {
      setIsSaving(false);
    }
  }, [displayNameDirty, displayNameError, getValidatedDraft, markSaved, trimmedDisplayName, updateUser, user]);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
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

  const handleRevertProfile = useCallback(() => {
    setDisplayName(canonicalDisplayName);
    setAvatarUrl(user ? getAvatarUrl(user) : '');
  }, [canonicalDisplayName, user]);
  const renderTabLabel = useCallback((text: string, dirty: boolean) => {
    return (
      <span className="flex items-center gap-2">
        <span>{text}</span>
        {dirty && (
          <>
            <span className="sr-only">Unsaved changes</span>
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-bolt-elements-warning-text" />
          </>
        )}
      </span>
    );
  }, []);

  const tabSections: { value: string; label: React.ReactNode; ariaLabel: string; content: React.ReactNode }[] = [];

  if (user) {
    const profileDirty = displayNameDirty;
    tabSections.push({
      value: 'profile',
      label: renderTabLabel('Profile', profileDirty),
      ariaLabel: profileDirty ? 'Profile (unsaved changes)' : 'Profile',
      content: (
        <ProfileTab
          displayName={displayName}
          email={user.email || ''}
          avatarUrl={avatarUrl}
          userId={user.id}
          onDisplayNameChange={setDisplayName}
          onAvatarUpdate={handleAvatarUpdate}
          onRevert={handleRevertProfile}
          dirty={displayNameDirty}
          displayNameError={displayNameError}
        />
      ),
    });
  }

  tabSections.push(
    {
      value: 'editor',
      label: renderTabLabel('Editor', sectionDirtyState.editor),
      ariaLabel: sectionDirtyState.editor ? 'Editor (unsaved changes)' : 'Editor',
      content: (
        <EditorTab
          settings={draft.editor}
          onSettingChange={handleEditorSettingChange}
          onReset={resetEditorSettings}
          onRevert={() => revertSection('editor')}
          dirty={sectionDirtyState.editor}
          errors={editorErrors}
        />
      ),
    },
    {
      value: 'ai-assistant',
      label: renderTabLabel('AI Assistant', sectionDirtyState.ai),
      ariaLabel: sectionDirtyState.ai ? 'AI Assistant (unsaved changes)' : 'AI Assistant',
      content: (
        <AiAssistantTab
          settings={draft.ai}
          onSettingChange={handleAISettingChange}
          onReset={resetAISettings}
          onRevert={() => revertSection('ai')}
          dirty={sectionDirtyState.ai}
          errors={aiErrors}
        />
      ),
    },
    {
      value: 'preferences',
      label: renderTabLabel('Preferences', sectionDirtyState.preferences),
      ariaLabel: sectionDirtyState.preferences ? 'Preferences (unsaved changes)' : 'Preferences',
      content: (
        <PreferencesTab
          preferences={draft.preferences}
          onPreferenceChange={handlePreferenceChange}
          onReset={resetPreferences}
          onRevert={() => revertSection('preferences')}
          dirty={sectionDirtyState.preferences}
          errors={preferencesErrors}
        />
      ),
    },
    { value: 'usage', label: renderTabLabel('Usage', false), ariaLabel: 'Usage', content: <UsageTab /> },
    {
      value: 'account',
      label: renderTabLabel('Account', false),
      ariaLabel: 'Account',
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
          passwordError={passwordError}
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
          {hasPendingChanges && (
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
          <Button variant="secondary" onClick={handleExportSettings} size="sm">
            Export
          </Button>
          <Button variant="secondary" onClick={handleImportSettings} size="sm">
            Import
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving || !hasPendingChanges || Boolean(displayNameError)}
            className={classNames(
              hasPendingChanges
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
          {persistenceUnavailable && (
            <div className="mb-6 flex items-start gap-3 rounded-[calc(var(--radius))] border border-bolt-elements-warning-border bg-bolt-elements-warning-background/30 p-4 text-sm text-bolt-elements-warning-text">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-bolt-elements-warning-text">Local persistence unavailable</p>
                <p>
                  Your browser blocked IndexedDB access, so settings are stored only for this session. Use the Export / Import buttons above to back up changes manually.
                </p>
              </div>
            </div>
          )}
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
                  aria-label={section.ariaLabel}
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

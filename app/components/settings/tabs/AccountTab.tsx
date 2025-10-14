import { SettingCard } from '~/components/settings/SettingCard';
import { SettingsSection } from '~/components/settings/SettingsSection';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';

interface AccountTabProps {
  newPassword: string;
  confirmPassword: string;
  isChangingPassword: boolean;
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
  onShowDeleteConfirm: (show: boolean) => void;
  passwordError?: string | null;
}

export function AccountTab({
  newPassword,
  confirmPassword,
  isChangingPassword,
  showDeleteConfirm,
  isDeleting,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onChangePassword,
  onDeleteAccount,
  onShowDeleteConfirm,
  passwordError,
}: AccountTabProps) {
  return (
    <SettingsSection title="Account" description="Manage your account" status="implemented">
      {/* Password Change */}
      <SettingCard title="Change Password" size="sm" className="mb-6">
        <div className="space-y-4 max-w-sm">
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">New Password</label>
            <Input
              uiSize="sm"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              className="w-full rounded-[calc(var(--radius))] transition-theme"
              aria-invalid={Boolean(passwordError)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textSecondary mb-2">
              Confirm New Password
            </label>
            <Input
              uiSize="sm"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className="w-full rounded-[calc(var(--radius))] transition-theme"
              aria-invalid={Boolean(passwordError)}
            />
          </div>
          <Button
            onClick={onChangePassword}
            disabled={isChangingPassword || !newPassword || !confirmPassword || !!passwordError}
            size="sm"
            className="rounded-[calc(var(--radius))] transition-theme"
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
          {passwordError ? (
            <p className="text-xs font-medium text-bolt-elements-button-danger-text">{passwordError}</p>
          ) : (
            <p className="text-xs text-bolt-elements-textSecondary italic">
              Password must be at least 8 characters long and include a mix of letters, numbers, and symbols.
            </p>
          )}
        </div>
      </SettingCard>

      {/* Danger Zone */}
      <SettingCard
        title="Danger Zone"
        description="Permanently delete your account and all associated data. This action cannot be undone."
        variant="danger"
      >
        {!showDeleteConfirm ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() => onShowDeleteConfirm(true)}
            className="rounded-[calc(var(--radius))] transition-theme animate-scaleIn"
          >
            Delete Account
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-bolt-elements-textSecondary">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={onDeleteAccount}
                disabled={isDeleting}
                className="rounded-[calc(var(--radius))] transition-theme animate-scaleIn"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-[calc(var(--radius))] transition-theme animate-scaleIn"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </SettingCard>
    </SettingsSection>
  );
}

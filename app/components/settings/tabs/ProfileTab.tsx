import { AvatarUpload } from '~/components/settings/AvatarUpload';
import { SettingCard } from '~/components/settings/SettingCard';
import { SettingItem } from '~/components/settings/SettingItem';
import { SettingsSection } from '~/components/settings/SettingsSection';
import { Input } from '~/components/ui/Input';

interface ProfileTabProps {
  displayName: string;
  email: string;
  avatarUrl: string;
  userId: string;
  onDisplayNameChange: (value: string) => void;
  onAvatarUpdate: (url: string) => void;
  onRevert?: () => void;
  dirty?: boolean;
  displayNameError?: string | null;
}

export function ProfileTab({
  displayName,
  email,
  avatarUrl,
  userId,
  onDisplayNameChange,
  onAvatarUpdate,
  onRevert,
  dirty = false,
  displayNameError,
}: ProfileTabProps) {
  return (
    <SettingsSection
      title="Profile"
      description="Manage your account information"
      status="implemented"
      onRevert={onRevert}
      dirty={dirty}
    >
      <SettingCard>
        {/* Avatar Upload */}
        <div className="mb-8">
          <h3 className="mb-4 text-sm font-semibold text-bolt-elements-textPrimary">Profile Picture</h3>
          <AvatarUpload currentAvatarUrl={avatarUrl} userId={userId} onAvatarUpdate={onAvatarUpdate} />
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <SettingItem
            label="Display Name"
            description="Your name as it appears in the application"
            error={displayNameError || undefined}
          >
            <Input
              type="text"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              className="w-full max-w-xs"
            />
          </SettingItem>
          <SettingItem label="Email Address" description="Your email address (cannot be changed here)">
            <Input type="email" value={email} disabled className="w-full max-w-xs" />
          </SettingItem>
        </div>
      </SettingCard>
    </SettingsSection>
  );
}

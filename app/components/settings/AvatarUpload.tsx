import { Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '~/lib/supabase/client';
import { classNames } from '~/utils/classNames';

interface AvatarUploadProps {
  currentAvatarUrl: string;
  userId: string;
  onAvatarUpdate: (newUrl: string) => void;
}

export const AvatarUpload = ({ currentAvatarUrl, userId, onAvatarUpdate }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();

    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client not configured');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: publicUrl,
        },
      });

      if (updateError) {
        throw updateError;
      }

      // Notify parent component
      onAvatarUpdate(publicUrl);

      toast.success('Avatar uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error?.message || 'Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePreview = () => {
    setPreviewUrl(null);
  };

  const avatarSrc = previewUrl || currentAvatarUrl || null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-bolt-elements-borderColor"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-bolt-elements-background-depth-3 ring-2 ring-bolt-elements-borderColor flex items-center justify-center">
              <Upload className="h-8 w-8 text-bolt-elements-textSecondary" />
            </div>
          )}
          {previewUrl && (
            <button
              onClick={handleRemovePreview}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-bolt-elements-button-danger-background text-white shadow-lg transition-transform hover:scale-110"
              title="Remove preview"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <label
            htmlFor="avatar-upload"
            className={classNames(
              'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-4 py-2 text-sm font-medium text-bolt-elements-textPrimary transition-colors hover:bg-bolt-elements-background-depth-3',
              uploading ? 'cursor-not-allowed opacity-50' : '',
            )}
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload New Avatar'}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <p className="mt-2 text-xs text-bolt-elements-textSecondary">
            JPG, PNG or GIF. Max size 2MB. Recommended: 400x400px
          </p>
        </div>
      </div>

      {uploading && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
          <p className="text-xs text-blue-600 dark:text-blue-500">Uploading your avatar...</p>
        </div>
      )}
    </div>
  );
};

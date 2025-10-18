import { X, Image as ImageIcon } from 'lucide-react';
import { useRef } from 'react';
import { classNames } from '~/utils/classNames';

export interface ImageAttachment {
  url: string;
  mimeType: string;
  name: string;
}

interface ImageUploadProps {
  images: ImageAttachment[];
  onImagesChange: (images: ImageAttachment[]) => void;
  disabled?: boolean;
}

export function ImageUpload({ images, onImagesChange, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const newImages: ImageAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Only accept image files
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      const imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      newImages.push({
        url: imageData,
        mimeType: file.type,
        name: file.name,
      });
    }

    onImagesChange([...images, ...newImages]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={classNames(
          'flex items-center justify-center w-9 h-9 rounded-lg transition-all',
          'bg-bolt-elements-background-depth-2 hover:bg-bolt-elements-background-depth-3',
          'border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive',
          'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        title="Upload image"
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border-2 border-bolt-elements-borderColor"
            >
              <img
                src={image.url}
                alt={image.name}
                className="w-16 h-16 object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

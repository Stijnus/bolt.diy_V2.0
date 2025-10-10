import { SettingItem } from '~/components/settings/SettingItem';
import { SettingsSection } from '~/components/settings/SettingsSection';
import { Input } from '~/components/ui/Input';
import { Switch } from '~/components/ui/Switch';
import type { EditorSettings } from '~/lib/stores/settings';

interface EditorTabProps {
  settings: EditorSettings;
  onSettingChange: (key: keyof EditorSettings, value: any) => void;
  onReset: () => void;
}

export function EditorTab({ settings, onSettingChange, onReset }: EditorTabProps) {
  return (
    <SettingsSection
      title="Editor"
      description="Customize your code editor preferences"
      status="implemented"
      onReset={onReset}
    >
      <SettingItem
        label="Tab Size"
        description="Number of spaces per tab"
        tooltip="Controls how many spaces are inserted when you press the Tab key. Common values are 2 or 4 spaces."
      >
        <Input
          type="number"
          min={2}
          max={8}
          value={settings.tabSize}
          onChange={(e) => onSettingChange('tabSize', parseInt(e.target.value, 10))}
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
          value={settings.fontSize}
          onChange={(e) => onSettingChange('fontSize', parseInt(e.target.value, 10))}
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
          value={settings.lineHeight}
          onChange={(e) => onSettingChange('lineHeight', parseFloat(e.target.value))}
          className="w-20"
        />
      </SettingItem>
      <SettingItem
        label="Word Wrap"
        description="Wrap long lines"
        tooltip="When enabled, long lines of code will automatically wrap to the next line instead of requiring horizontal scrolling."
      >
        <Switch checked={settings.wordWrap} onChange={(checked) => onSettingChange('wordWrap', checked)} />
      </SettingItem>
      <SettingItem
        label="Minimap"
        description="Show code minimap"
        tooltip="Displays a small overview of your entire file on the right side of the editor, making it easier to navigate large files."
      >
        <Switch checked={settings.minimap} onChange={(checked) => onSettingChange('minimap', checked)} />
      </SettingItem>
      <SettingItem
        label="Line Numbers"
        description="Show line numbers"
        tooltip="Displays line numbers in the left gutter of the editor, useful for referencing specific lines and debugging."
      >
        <Switch checked={settings.lineNumbers} onChange={(checked) => onSettingChange('lineNumbers', checked)} />
      </SettingItem>
    </SettingsSection>
  );
}

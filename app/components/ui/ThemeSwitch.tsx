import { useStore } from '@nanostores/react';
import { Sun, Moon } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { IconButton } from './IconButton';
import { themeStore, toggleTheme } from '~/lib/stores/theme';

interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch = memo(({ className }: ThemeSwitchProps) => {
  const theme = useStore(themeStore);
  const [domLoaded, setDomLoaded] = useState(false);

  useEffect(() => {
    setDomLoaded(true);
  }, []);

  return (
    domLoaded && (
      <IconButton
        className={className}
        icon={theme === 'dark' ? Sun : Moon}
        size="sm"
        title="Toggle Theme"
        onClick={toggleTheme}
      />
    )
  );
});

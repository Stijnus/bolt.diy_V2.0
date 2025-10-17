import { HelpCircle, LogOut, Upload, FolderUp, Settings, FolderKanban } from 'lucide-react';
import { memo } from 'react';
import { MenuItem } from './MenuItem';

interface SidebarFooterProps {
  user: any;
  onImportClick: () => void;
  onImportFolderClick: () => void;
  onSettingsClick: () => void;
  onSignOut?: () => void;
  userPanel: React.ReactNode;
}

export const SidebarFooter = memo(
  ({ user, onImportClick, onImportFolderClick, onSettingsClick, onSignOut, userPanel }: SidebarFooterProps) => {
    return (
      <div className="mt-auto border-t border-bolt-elements-borderColor bg-bolt-elements-background-depth-1">
        {/* User Panel at bottom - only show when logged in */}
        {user && <div className="px-2 py-3">{userPanel}</div>}

        {/* Menu Items */}
        <nav className="px-2 pb-3 pt-3 space-y-1">
          {/* Import Actions */}
          <MenuItem icon={Upload} onClick={onImportClick}>
            Import Chat
          </MenuItem>

          <MenuItem icon={FolderUp} onClick={onImportFolderClick}>
            Import Folder
          </MenuItem>

          {/* Projects (only for logged-in users) */}
          {user && (
            <MenuItem icon={FolderKanban} href="/projects">
              Projects
            </MenuItem>
          )}

          {/* Settings */}
          <MenuItem icon={Settings} onClick={onSettingsClick}>
            Settings
          </MenuItem>

          {/* Help Center */}
          <MenuItem icon={HelpCircle} href="https://stijnus.github.io/bolt.diy_V2.0/" className="no-underline">
            Help Center
          </MenuItem>

          {/* User-specific menu items */}
          {user && (
            <>
              <MenuItem icon={LogOut} onClick={onSignOut}>
                Sign Out
              </MenuItem>
            </>
          )}
        </nav>
      </div>
    );
  },
);

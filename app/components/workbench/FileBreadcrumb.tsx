import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { File as FileIcon, ChevronRight } from 'lucide-react';
import { memo, useState } from 'react';
import FileTree from './FileTree';
import type { FileMap } from '~/lib/stores/files';
import { classNames } from '~/utils/classNames';
import { WORK_DIR } from '~/utils/constants';
import { cubicEasingFn } from '~/utils/easings';
import { renderLogger } from '~/utils/logger';

const WORK_DIR_REGEX = new RegExp(`^${WORK_DIR.split('/').slice(0, -1).join('/').replaceAll('/', '\\/')}/`);

interface FileBreadcrumbProps {
  files?: FileMap;
  pathSegments?: string[];
  onFileSelect?: (filePath: string) => void;
}

const contextMenuVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: cubicEasingFn,
    },
  },
  close: {
    y: 6,
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

export const FileBreadcrumb = memo<FileBreadcrumbProps>(({ files, pathSegments = [], onFileSelect }) => {
  renderLogger.trace('FileBreadcrumb');

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (files === undefined || pathSegments.length === 0) {
    return null;
  }

  return (
    <div className="flex">
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;

        const path = pathSegments.slice(0, index).join('/');

        if (!WORK_DIR_REGEX.test(path)) {
          return null;
        }

        const isActive = activeIndex === index;

        return (
          <div key={index} className="relative flex items-center">
            <DropdownMenu.Root
              open={isActive}
              modal={false}
              onOpenChange={(open) => {
                console.debug('FileBreadcrumb menu onOpenChange', { index, open });
                setActiveIndex(open ? index : null);
              }}
            >
              <DropdownMenu.Trigger asChild>
                <span
                  className={classNames('flex items-center gap-1.5 cursor-pointer shrink-0', {
                    'text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary': !isActive,
                    'text-bolt-elements-textPrimary underline': isActive,
                    'pr-4': isLast,
                  })}
                >
                  {isLast && <FileIcon className="w-4 h-4" />}
                  {segment}
                </span>
              </DropdownMenu.Trigger>
              {index > 0 && !isLast && <ChevronRight className="w-4 h-4 inline-block mx-1" />}
              <AnimatePresence>
                {isActive && (
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="z-[998]"
                      asChild
                      align="start"
                      side="bottom"
                      avoidCollisions={false}
                    >
                      <motion.div initial="close" animate="open" exit="close" variants={contextMenuVariants}>
                        <div className="rounded-lg overflow-hidden">
                          <div className="max-h-[50vh] min-w-[300px] overflow-scroll bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor shadow-sm rounded-lg">
                            <FileTree
                              files={files}
                              hideRoot
                              rootFolder={path}
                              collapsed
                              allowFolderSelection
                              selectedFile={`${path}/${segment}`}
                              onFileSelect={(filePath) => {
                                setActiveIndex(null);
                                onFileSelect?.(filePath);
                              }}
                            />
                          </div>
                        </div>
                        <DropdownMenu.Arrow className="fill-bolt-elements-borderColor" />
                      </motion.div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                )}
              </AnimatePresence>
            </DropdownMenu.Root>
          </div>
        );
      })}
    </div>
  );
});

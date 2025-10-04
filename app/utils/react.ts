import { memo, type JSXElementConstructor } from 'react';
import type * as ReactNS from 'react';

export const genericMemo: <T extends keyof ReactNS.JSX.IntrinsicElements | JSXElementConstructor<any>>(
  component: T,
  propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean,
) => T & { displayName?: string } = memo as any;

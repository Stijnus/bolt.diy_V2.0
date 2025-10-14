import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';

// Load error testing utilities in development
if (import.meta.env.DEV) {
  import('~/lib/debug/error-testing.client').catch(() => {
    // Silently fail if module doesn't load
  });
}

export const meta: MetaFunction = () => {
  return [
    { title: 'BoltDIY V2.0 - AI-Powered Development Platform' },
    {
      name: 'description',
      content: 'BoltDIY V2.0: Build, iterate, and deploy with AI. Your intelligent development companion.',
    },
  ];
};

export const loader = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');

  return json({
    projectId: projectId || undefined,
  });
};

export default function Index() {
  return (
    <div className="flex flex-col h-full w-full">
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </div>
  );
}

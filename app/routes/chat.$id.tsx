import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  const url = new URL(args.request.url);
  const projectId = url.searchParams.get('projectId');

  return json({
    id: args.params.id,
    projectId: projectId || undefined,
  });
}

export default IndexRoute;

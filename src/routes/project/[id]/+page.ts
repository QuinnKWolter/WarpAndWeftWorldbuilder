import { error } from '@sveltejs/kit';
import { validateBundle } from '#lib/domain/model';
import type { PageLoad } from './$types';
export const load: PageLoad = async ({ fetch, params }) => {
  const response = await fetch(`/api/projects/${params.id}`);
  if (!response.ok) error(response.status, 'This story could not be opened.');
  return { bundle: validateBundle(await response.json()) };
};

import { z } from 'zod';
import { folderIcons } from './organization';
import type { Json } from './model';
const schema = z.object({ color: z.string().regex(/^#[0-9a-f]{6}$/i), icon: z.enum(folderIcons) });
export function facetIcon(facets: string[]): (typeof folderIcons)[number] {
  return facets.includes('location')
    ? 'map'
    : facets.includes('item')
      ? 'gem'
      : facets.includes('character')
        ? 'users'
        : 'sparkles';
}
export function presentation(
  metadata: Record<string, Json>,
  icon: (typeof folderIcons)[number] = 'book'
) {
  const parsed = schema.safeParse(metadata.presentation);
  return parsed.success ? parsed.data : { color: '#50856e', icon };
}

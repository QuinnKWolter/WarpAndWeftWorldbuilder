import { z } from 'zod';
import type { Bundle, Json } from './model';

export { iconIds as folderIcons } from './icons';
import { iconIds as folderIcons } from './icons';
export const folderSections = ['entities', 'ideas', 'threads'] as const;
export type FolderSection = (typeof folderSections)[number];
export const folderSchema = z.object({
  id: z.uuid(),
  parentId: z.uuid().nullable().default(null),
  section: z.enum(folderSections),
  name: z.string().trim().min(1).max(240),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .default('#50856e'),
  icon: z.enum(folderIcons).default('folder'),
  rank: z.number().finite(),
  facet: z.string().nullable().default(null),
  collapsed: z.boolean().default(false)
});
export const organizationSchema = z.object({
  folders: z.array(folderSchema).max(2000).default([]),
  placements: z
    .array(
      z.object({ objectId: z.uuid(), folderId: z.uuid().nullable(), rank: z.number().finite() })
    )
    .max(30000)
    .default([]),
  collapsedUnits: z.array(z.uuid()).default([])
});
export type Organization = z.infer<typeof organizationSchema>;
export type StoryFolder = z.infer<typeof folderSchema>;
export function organization(b: Bundle): Organization {
  const defaults = [
    { name: 'Characters', icon: 'users', facet: 'character', color: '#50856e' },
    { name: 'Places', icon: 'map', facet: 'location', color: '#537fa0' },
    { name: 'Objects', icon: 'gem', facet: 'item', color: '#ad8150' },
    { name: 'Other entities', icon: 'sparkles', facet: 'other', color: '#9373a3' }
  ].map((folder, index) => ({
    ...folder,
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    section: 'entities',
    rank: (index + 1) * 1024
  }));
  const o = organizationSchema.parse(b.project.settings.organization ?? { folders: defaults });
  const placed = new Set(o.placements.map((p) => p.objectId));
  for (const entity of b.entities) {
    if (placed.has(entity.id)) continue;
    const facet =
      ['character', 'location', 'item'].find((f) => entity.facets.includes(f)) ?? 'other';
    const folder = o.folders.find((f) => f.facet === facet && f.section === 'entities');
    if (folder)
      o.placements.push({
        objectId: entity.id,
        folderId: folder.id,
        rank: (o.placements.length + 1) * 1024
      });
  }
  return o;
}
export function writeOrganization(b: Bundle, value: Organization) {
  b.project.settings.organization = organizationSchema.parse(value) as Json;
}
export function objectSection(b: Bundle, id: string): FolderSection | undefined {
  if (b.entities.some((e) => e.id === id)) return 'entities';
  if (b.units.some((u) => u.id === id)) return 'ideas';
  if (b.threads.some((t) => t.id === id)) return 'threads';
}
export function validateOrganization(b: Bundle) {
  const o = organization(b);
  const ids = new Set(o.folders.map((f) => f.id));
  if (ids.size !== o.folders.length) throw new Error('Folder identifiers must be unique.');
  const placed = new Set<string>();
  const sections = new Map<string, FolderSection>([
    ...b.entities.map((e) => [e.id, 'entities'] as const),
    ...b.units.map((u) => [u.id, 'ideas'] as const),
    ...b.threads.map((t) => [t.id, 'threads'] as const)
  ]);
  for (const folder of o.folders) {
    const visited = new Set([folder.id]);
    let parent = folder.parentId;
    while (parent) {
      const ancestor = o.folders.find((f) => f.id === parent);
      if (!ancestor || ancestor.section !== folder.section)
        throw new Error('Folder parent is missing or belongs to another section.');
      if (visited.has(parent)) throw new Error('A folder cannot contain itself.');
      visited.add(parent);
      parent = ancestor.parentId;
    }
  }
  for (const p of o.placements) {
    const section = sections.get(p.objectId);
    if (!section || placed.has(p.objectId))
      throw new Error('Folder item is missing or duplicated.');
    placed.add(p.objectId);
    if (p.folderId && o.folders.find((f) => f.id === p.folderId)?.section !== section)
      throw new Error('This item does not belong in that folder section.');
  }
  if (o.collapsedUnits.some((id) => !b.units.some((u) => u.id === id)))
    throw new Error('Collapsed narrative container is missing.');
}
export function moveShelfObject(
  b: Bundle,
  id: string,
  folderId: string | null,
  beforeId: string | null = null
) {
  const o = organization(b);
  const section = objectSection(b, id);
  if (!section || (folderId && o.folders.find((f) => f.id === folderId)?.section !== section))
    throw new Error('Choose a folder in the same section.');
  const source = section === 'entities' ? b.entities : section === 'threads' ? b.threads : b.units;
  const list = source
    .map((item, index) => ({
      id: item.id,
      folderId: o.placements.find((p) => p.objectId === item.id)?.folderId ?? null,
      rank: o.placements.find((p) => p.objectId === item.id)?.rank ?? (index + 1) * 1024
    }))
    .filter((item) => item.id !== id && item.folderId === folderId)
    .sort((a, c) => a.rank - c.rank);
  const index = beforeId ? list.findIndex((item) => item.id === beforeId) : list.length;
  if (index < 0) throw new Error('Drop position is no longer available.');
  list.splice(index, 0, { id, folderId, rank: 0 });
  o.placements = o.placements.filter((p) => !list.some((item) => item.id === p.objectId));
  o.placements.push(
    ...list.map((item, i) => ({ objectId: item.id, folderId, rank: (i + 1) * 1024 }))
  );
  const folder = o.folders.find((f) => f.id === folderId);
  if (folder) folder.collapsed = false;
  writeOrganization(b, o);
}
export function moveFolder(
  b: Bundle,
  id: string,
  parentId: string | null,
  beforeId: string | null = null
) {
  const o = organization(b);
  const folder = o.folders.find((f) => f.id === id);
  if (!folder) throw new Error('Folder not found.');
  let parent = parentId;
  while (parent) {
    if (parent === id) throw new Error('A folder cannot contain itself.');
    const ancestor = o.folders.find((f) => f.id === parent);
    if (!ancestor || ancestor.section !== folder.section)
      throw new Error('Choose a folder in the same section.');
    parent = ancestor.parentId;
  }
  const list = o.folders
    .filter((f) => f.id !== id && f.parentId === parentId && f.section === folder.section)
    .sort((a, c) => a.rank - c.rank);
  const index = beforeId ? list.findIndex((f) => f.id === beforeId) : list.length;
  if (index < 0) throw new Error('Drop position is no longer available.');
  folder.parentId = parentId;
  list.splice(index, 0, folder);
  list.forEach((f, i) => (f.rank = (i + 1) * 1024));
  const target = o.folders.find((f) => f.id === parentId);
  if (target) target.collapsed = false;
  writeOrganization(b, o);
}
export function removeFolder(b: Bundle, id: string) {
  const o = organization(b);
  const folder = o.folders.find((f) => f.id === id);
  if (!folder) return;
  const items = o.placements.filter((p) => p.folderId === id).sort((a, c) => a.rank - c.rank);
  for (const child of o.folders.filter((f) => f.parentId === id)) child.parentId = folder.parentId;
  o.folders = o.folders.filter((f) => f.id !== id);
  // Removing a folder releases its contents; it never deletes story objects.
  for (const p of items) p.folderId = folder.parentId;
  writeOrganization(b, o);
  for (const item of items) moveShelfObject(b, item.objectId, folder.parentId);
}
export function remapOrganization(b: Bundle, map: Map<string, string>) {
  if (!b.project.settings.organization) return;
  // Canonical ids have already changed. Parse saved placements before adding defaults.
  const o = organizationSchema.parse(b.project.settings.organization);
  o.folders = o.folders.map((f) => ({
    ...f,
    id: map.get(f.id) ?? f.id,
    parentId: f.parentId ? (map.get(f.parentId) ?? f.parentId) : null
  }));
  o.placements = o.placements.map((p) => ({
    ...p,
    objectId: map.get(p.objectId) ?? p.objectId,
    folderId: p.folderId ? (map.get(p.folderId) ?? p.folderId) : null
  }));
  o.collapsedUnits = o.collapsedUnits.map((id) => map.get(id) ?? id);
  writeOrganization(b, o);
}

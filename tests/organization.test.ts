import { describe, expect, it } from 'vitest';
import {
  organization,
  writeOrganization,
  folderSchema,
  moveShelfObject,
  moveFolder,
  removeFolder
} from '../src/lib/domain/organization';
import { base, validateBundle } from '../src/lib/domain/model';
import { demoProject } from '../src/lib/domain/demo';
import { cloneProject, removeObject } from '../src/lib/domain/operations';
import { mergePlaceholder } from '../src/lib/domain/placeholders';

describe('portable workspace organization', () => {
  it('provides editable facet folders for existing projects without changing source data', () => {
    const b = demoProject();
    const before = JSON.stringify(b);
    const o = organization(b);
    expect(o.folders.map((f) => f.name)).toEqual([
      'Characters',
      'Places',
      'Objects',
      'Other entities'
    ]);
    expect(o.placements).toHaveLength(b.entities.length);
    expect(JSON.stringify(b)).toBe(before);
    expect(() => validateBundle(b)).not.toThrow();
  });
  it('moves and orders entities independently of narrative chronology and validates nesting', () => {
    const b = demoProject();
    const o = organization(b);
    const parent = folderSchema.parse({ ...base(), name: 'Coast', section: 'entities', rank: 100 });
    const child = folderSchema.parse({
      ...base(),
      name: 'Harbour folk',
      section: 'entities',
      rank: 200
    });
    o.folders.push(parent, child);
    writeOrganization(b, o);
    moveFolder(b, child.id, parent.id);
    const first = b.entities[0].id,
      second = b.entities[1].id;
    const chronology = b.units.map((u) => u.storyTime);
    moveShelfObject(b, first, child.id);
    moveShelfObject(b, second, child.id, first);
    expect(
      organization(b)
        .placements.filter((p) => p.folderId === child.id)
        .sort((a, c) => a.rank - c.rank)
        .map((p) => p.objectId)
    ).toEqual([second, first]);
    expect(b.units.map((u) => u.storyTime)).toEqual(chronology);
    expect(() => moveFolder(b, parent.id, child.id)).toThrow('itself');
    const idea = folderSchema.parse({ ...base(), name: 'Ideas', section: 'ideas', rank: 100 });
    const next = organization(b);
    next.folders.push(idea);
    writeOrganization(b, next);
    expect(() => moveShelfObject(b, first, idea.id)).toThrow('same section');
    expect(() => validateBundle(b)).not.toThrow();
  });
  it('removes folders while retaining members and nested folders; deletion cleans references', () => {
    const b = demoProject();
    const o = organization(b);
    const folder = o.folders[0];
    const child = folderSchema.parse({
      ...base(),
      name: 'Child',
      parentId: folder.id,
      section: 'entities',
      rank: 100
    });
    o.folders.push(child);
    writeOrganization(b, o);
    const count = b.entities.length;
    const id = b.entities[0].id;
    moveShelfObject(b, id, folder.id);
    removeFolder(b, folder.id);
    expect(b.entities).toHaveLength(count);
    expect(organization(b).folders.find((f) => f.id === child.id)?.parentId).toBeNull();
    expect(organization(b).placements.find((p) => p.objectId === id)?.folderId).toBeNull();
    removeObject(b, { kind: 'entity', id });
    expect(organization(b).placements.some((p) => p.objectId === id)).toBe(false);
    expect(() => validateBundle(b)).not.toThrow();
  });
  it('remaps organizational ids during clone/import while preserving custom appearance and collapse', () => {
    const b = demoProject();
    const o = organization(b);
    o.folders[0].name = 'People';
    o.folders[0].color = '#876543';
    o.folders[0].icon = 'moon';
    o.folders[0].collapsed = true;
    o.collapsedUnits = [b.units[0].id];
    writeOrganization(b, o);
    const copy = cloneProject(b);
    const cloned = organization(copy);
    expect(cloned.folders[0]).toMatchObject({
      name: 'People',
      color: '#876543',
      icon: 'moon',
      collapsed: true
    });
    expect(cloned.folders[0].id).not.toBe(o.folders[0].id);
    expect(cloned.collapsedUnits[0]).not.toBe(o.collapsedUnits[0]);
    expect(cloned.placements[0].objectId).not.toBe(o.placements[0].objectId);
    expect(() => validateBundle(copy)).not.toThrow();
  });
  it('keeps organized placeholder merges valid and rejects malformed saved organization', () => {
    const b = demoProject();
    const source = b.units.find((u) => u.unresolved)!;
    const target = b.units.find((u) => u.type === 'scene')!;
    moveShelfObject(b, source.id, null);
    mergePlaceholder(b, source.id, target.id);
    expect(organization(b).placements.some((p) => p.objectId === source.id)).toBe(false);
    expect(() => validateBundle(b)).not.toThrow();
    const bad = demoProject();
    const o = organization(bad);
    o.folders[0].parentId = o.folders[0].id;
    writeOrganization(bad, o);
    expect(() => validateBundle(bad)).toThrow('itself');
    const missing = demoProject();
    const value = organization(missing);
    value.placements.push({ objectId: crypto.randomUUID(), folderId: null, rank: 0 });
    writeOrganization(missing, value);
    expect(() => validateBundle(missing)).toThrow('missing');
  });
});

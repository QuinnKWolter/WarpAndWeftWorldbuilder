import { describe, it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { demoProject } from '../src/lib/domain/demo';
import { base, entitySchema, validateBundle, unitSchema } from '../src/lib/domain/model';
import {
  resolveRelationshipState,
  resolveStoryState,
  stateKey,
  sceneDiff
} from '../src/lib/domain/state';
import { narrativeOrder, storyOrder, placeUnit, siblings } from '../src/lib/domain/order';
import {
  cloneProject,
  removeObject,
  addMembership,
  restoreKeepingProse
} from '../src/lib/domain/operations';
import { projectGraph } from '../src/lib/domain/projections';
import { diagnose } from '../src/lib/domain/diagnostics';
import { mergePlaceholder, resolvePlaceholder } from '../src/lib/domain/placeholders';

describe('temporal story semantics', () => {
  it('steps through changes and relationship transitions at separate events within one point', () => {
    const b = demoProject();
    const event = b.events.find((e) => e.title === 'Mara opens the sealed gate')!;
    event.storyTime = 4;
    event.order = 20;
    const transition = b.relationshipStates.find((s) => s.label === 'Betrayed')!;
    transition.eventId = event.id;
    const acquisition = b.changes.find((c) => c.storyTime === 4 && c.value === true)!;
    acquisition.order = 20;
    const key = stateKey(acquisition.subjectId, acquisition.key, acquisition.targetId);
    expect(resolveStoryState(b, 4, false, 10).properties[key]).not.toBe(true);
    expect(resolveStoryState(b, 4, false, 20).properties[key]).toBe(true);
    expect(resolveRelationshipState(b, transition.relationshipId, 4, 10)?.label).toBe('Suspicious');
    expect(resolveRelationshipState(b, transition.relationshipId, 4, 20)?.label).toBe('Betrayed');
    expect(resolveStoryState(b, 4, true).relationships[transition.relationshipId]?.label).toBe(
      'Suspicious'
    );
  });
  it('resolves qualitative relationship histories at inclusive starts and exclusive ends', () => {
    const b = demoProject();
    const r = b.relationships[0];
    expect(resolveRelationshipState(b, r.id, 0)).toBeUndefined();
    expect(resolveRelationshipState(b, r.id, 1)?.label).toBe('Strangers');
    expect(resolveRelationshipState(b, r.id, 2)?.label).toBe('Friends');
    expect(resolveRelationshipState(b, r.id, 4)?.label).toBe('Betrayed');
    b.relationshipStates.find((s) => s.label === 'Betrayed')!.until = 5;
    expect(resolveRelationshipState(b, r.id, 5)).toBeUndefined();
  });
  it('resolves possession transfers and knowledge before and after the causing scene', () => {
    const b = demoProject();
    const mara = b.entities.find((e) => e.name === 'Mara Venn')!;
    const elian = b.entities.find((e) => e.name === 'Elian Rook')!;
    const key = b.entities.find((e) => e.name === 'The Copper Key')!;
    expect(resolveStoryState(b, 3).properties[stateKey(elian.id, 'possession', key.id)]).toBe(true);
    const after = resolveStoryState(b, 4);
    expect(after.properties[stateKey(elian.id, 'possession', key.id)]).toBe(false);
    expect(after.properties[stateKey(mara.id, 'possession', key.id)]).toBe(true);
    expect(
      resolveStoryState(b, 4, true).properties[stateKey(mara.id, 'possession', key.id)]
    ).toBeUndefined();
    const scene = b.units.find((u) => u.title === 'The things we choose to keep')!;
    expect(sceneDiff(b, scene.id).find((d) => d.subjectId === elian.id)?.previous).toBe(true);
  });
  it('keeps story chronology independent of reordering and supports arbitrary nesting', () => {
    const b = demoProject();
    const flash = b.units.find((u) => u.type === 'flashback')!;
    const first = siblings(b, flash.parentId)[0];
    expect(narrativeOrder(b).indexOf(flash)).toBeGreaterThan(narrativeOrder(b).indexOf(first));
    expect(storyOrder(b)[0]).toBe(flash);
    const times = b.units.map((u) => u.storyTime);
    placeUnit(b, flash.id, flash.parentId, first.id);
    expect(siblings(b, flash.parentId)[0]).toBe(flash);
    expect(b.units.map((u) => u.storyTime)).toEqual(times);
    expect(() => placeUnit(b, flash.id, flash.id, null)).toThrow();
    const beat = b.units.find((u) => u.type === 'beat')!;
    expect(() => placeUnit(b, beat.parentId!, beat.id, null)).toThrow();
  });
  it('inserts between beginning and ending without altering existing story timestamps', () => {
    const b = demoProject();
    const list = siblings(b, b.units[0].id);
    const unit = unitSchema.parse({ ...base(), title: 'Betrayal', rank: 999, storyTime: 22 });
    b.units.push(unit);
    placeUnit(b, unit.id, list[0].parentId, list[1].id);
    expect(
      siblings(b, list[0].parentId)
        .map((u) => u.title)
        .slice(0, 3)
    ).toEqual([list[0].title, 'Betrayal', list[1].title]);
  });
});
describe('portability and integrity', () => {
  it('resolves and merges unknowns while retaining prose, causes, children, threads and links', () => {
    const original = demoProject();
    const source = original.units.find((u) => u.unresolved)!;
    const target = original.units.find((u) => u.id === original.documents[0].unitId)!;
    const event = original.events[0];
    event.unitId = source.id;
    original.documents.push({
      ...base(),
      unitId: source.id,
      text: 'A retained idea.',
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A retained idea.' }] }]
      }
    });
    original.units.push(
      unitSchema.parse({ ...base(), title: 'Nested possibility', parentId: source.id, rank: 1024 })
    );
    original.links.push({
      ...base(),
      sourceId: source.id,
      targetId: original.units.find((u) => u.type === 'flashback')!.id,
      type: 'reveals'
    });
    const merged = structuredClone(original);
    mergePlaceholder(merged, source.id, target.id);
    expect(merged.documents[0].text).toContain('A retained idea.');
    expect(merged.events[0].unitId).toBe(target.id);
    expect(merged.units.find((u) => u.title === 'Nested possibility')?.parentId).toBe(target.id);
    expect(merged.links.at(-1)?.sourceId).toBe(target.id);
    expect(
      merged.units.find((u) => u.id === target.id)?.metadata.mergedNarrativeUnits
    ).toHaveLength(1);
    expect(validateBundle(merged)).toEqual(merged);
    const undone = restoreKeepingProse(original, merged, merged);
    expect(undone.documents).toEqual(original.documents);
    for (const kind of ['entity', 'event', 'scene'] as const) {
      const b = structuredClone(original);
      const selection = resolvePlaceholder(b, source.id, kind, 'A concrete idea');
      expect(selection.kind).toBe(kind === 'scene' ? 'unit' : kind);
      expect(b.units.find((u) => u.id === source.id)?.unresolved).toBe(false);
      expect(validateBundle(b)).toEqual(b);
    }
  });
  it('undoing graph changes preserves prose written afterward in surviving scenes', () => {
    const original = demoProject();
    const current = structuredClone(original);
    current.documents[0].text = 'Writing after a graph edit';
    current.documents[0].content = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: current.documents[0].text }] }]
    };
    const restored = restoreKeepingProse(original, current);
    expect(restored.documents[0].text).toBe(current.documents[0].text);
    removeObject(current, { kind: 'unit', id: original.documents[0].unitId });
    const undeleted = restoreKeepingProse(original, current);
    expect(undeleted.documents[0].text).toBe(original.documents[0].text);
  });
  it('round trips all semantic data and remaps identifiers when duplicating', () => {
    const b = demoProject();
    expect(validateBundle(JSON.parse(JSON.stringify(b)))).toEqual(b);
    const copy = cloneProject(b);
    expect(copy.project.id).not.toBe(b.project.id);
    expect(copy.units.map((u) => u.title)).toEqual(b.units.map((u) => u.title));
    expect(copy.relationshipStates.map((s) => s.label)).toEqual(
      b.relationshipStates.map((s) => s.label)
    );
    expect(copy.documents[0].text).toBe(b.documents[0].text);
    expect(validateBundle(copy)).toEqual(copy);
  });
  it('rejects dangling references, duplicate ids, cycles, malformed prose, unsafe links, and future formats', () => {
    const b = demoProject();
    b.relationships[0].sourceId = crypto.randomUUID();
    expect(() => validateBundle(b)).toThrow('Missing reference');
    const duplicate = demoProject();
    duplicate.entities.push(duplicate.entities[0]);
    expect(() => validateBundle(duplicate)).toThrow('Duplicate');
    const cycle = demoProject();
    cycle.units[0].parentId = cycle.units[0].id;
    expect(() => validateBundle(cycle)).toThrow('cycle');
    const unsafe = demoProject();
    unsafe.documents[0].content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'bad',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]
            }
          ]
        }
      ]
    };
    expect(() => validateBundle(unsafe)).toThrow('URL');
    expect(() => validateBundle({ ...demoProject(), version: 2 })).toThrow();
  });
  it('deletes referenced entities and nested scenes without leaving dangling data', () => {
    const b = demoProject();
    removeObject(b, { kind: 'entity', id: b.entities[0].id });
    expect(() => validateBundle(b)).not.toThrow();
    const nested = demoProject();
    removeObject(nested, { kind: 'unit', id: nested.units[0].id });
    expect(() => validateBundle(nested)).not.toThrow();
  });
  it('adds a location with a typed membership and avoids duplicates', () => {
    const b = demoProject();
    const place = b.entities.find((e) => e.facets.includes('location'))!;
    const unit = b.units.find((u) => u.type === 'flashback')!;
    addMembership(b, unit.id, place.id);
    addMembership(b, unit.id, place.id);
    expect(
      b.memberships.filter((m) => m.unitId === unit.id && m.entityId === place.id)
    ).toHaveLength(1);
    expect(b.memberships.find((m) => m.unitId === unit.id && m.entityId === place.id)?.role).toBe(
      'setting'
    );
  });
});
describe('projections and continuity', () => {
  const context = {
    lens: 'relationships' as const,
    at: 1,
    temporal: true,
    parentId: null,
    threadIds: [],
    detail: 2
  };
  it('changes relationship edges with time and summarizes the whole history', () => {
    const b = demoProject();
    expect(projectGraph(b, context).edges[0].data.label).toBe('Strangers');
    expect(projectGraph(b, { ...context, at: 4 }).edges[0].data.label).toBe('Betrayed');
    expect(projectGraph(b, { ...context, temporal: false }).edges[0].data.label).toContain(
      'Strangers → Friends'
    );
  });
  it('filters overlapping plot threads without mutating the underlying project', () => {
    const b = demoProject();
    const before = JSON.stringify(b);
    const graph = projectGraph(b, { ...context, lens: 'threads', threadIds: [b.threads[1].id] });
    expect(graph.nodes).toHaveLength(3);
    expect(JSON.stringify(b)).toBe(before);
  });
  it('finds possession errors, unplaced ideas, unresolved setups and reader-order changes', () => {
    const b = demoProject();
    const issues = diagnose(b);
    expect(issues.some((i) => i.rule === 'state-requirement' && i.message.includes('Mara'))).toBe(
      true
    );
    expect(issues.some((i) => i.rule === 'setup')).toBe(true);
    expect(issues.some((i) => i.rule === 'unresolved')).toBe(true);
    const event = b.events.find((e) => e.title === 'Mara opens the sealed gate')!;
    event.storyTime = 6;
    const acquisition = b.changes.find(
      (c) => c.subjectId === event.requirements[0].subjectId && c.key === 'possession'
    )!;
    expect(diagnose(b).some((i) => i.rule === 'reader-order')).toBe(true);
    placeUnit(
      b,
      acquisition.unitId!,
      b.units.find((u) => u.id === event.unitId)!.parentId,
      event.unitId
    );
    expect(diagnose(b).some((i) => i.rule === 'reader-order')).toBe(false);
  });
  it('projects hundreds of entities and thousands of records within a practical budget', () => {
    const b = demoProject();
    for (let i = 0; i < 500; i++)
      b.entities.push(
        entitySchema.parse({ ...base(), name: `Entity ${i}`, facets: ['character'] })
      );
    for (let i = 0; i < 2000; i++)
      b.relationships.push({
        ...b.relationships[0],
        id: crypto.randomUUID(),
        sourceId: b.entities[i % b.entities.length].id,
        targetId: b.entities[(i + 1) % b.entities.length].id
      });
    const start = performance.now();
    const graph = projectGraph(b, { ...context, lens: 'world' });
    expect(graph.nodes.length).toBeGreaterThan(500);
    expect(performance.now() - start).toBeLessThan(1000);
  });
});

import { describe, it, expect } from 'vitest';
import { demoProject } from '../src/lib/domain/demo';
import { base, unitSchema, validateBundle, type Json } from '../src/lib/domain/model';
import {
  cloneProject,
  markdownExport,
  removeObject,
  restoreKeepingProse
} from '../src/lib/domain/operations';
import {
  documentMarkdown,
  proseText,
  saveDocument,
  references,
  populateOutline,
  expandReferences,
  storyObjects
} from '../src/lib/domain/manuscript';
import { edgeAnchors } from '../src/lib/domain/anchors';
import { projectGraph } from '../src/lib/domain/projections';
import { mergePlaceholder } from '../src/lib/domain/placeholders';
import { parseEntityBatch } from '../src/lib/domain/entity-batch';
describe('connected manuscript', () => {
  it('preserves formatting and every reference kind across validation, copy, deletion and undo', () => {
    const b = demoProject();
    const unit = b.units.find((u) => u.type === 'scene')!;
    const objects = storyObjects(b);
    const chosen = ['entity', 'unit', 'event', 'relationship', 'thread'].map((kind) =>
      objects.find((o) => o.kind === kind)!
    );
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'A story.', marks: [{ type: 'bold' }] },
            ...chosen.map((o) => ({
              type: 'storyReference',
              attrs: { objectId: o.id, kind: o.kind, label: o.label }
            }))
          ]
        }
      ]
    } as Json;
    saveDocument(b, unit.id, content);
    expect(() => validateBundle(b)).not.toThrow();
    expect(references(content)).toHaveLength(5);
    expect(proseText(content)).toBe('A story.');
    expect(documentMarkdown(content)).toBe('**A story.**');
    expect(documentMarkdown(content, true)).toContain('{{story:entity:');
    expect(markdownExport(b)).toContain('**A story.**');
    expect(markdownExport(b)).not.toContain('{{story:');
    const copy = cloneProject(b);
    const copied = copy.documents.find((d) => d.text === 'A story.')!;
    const copyIds = new Set(storyObjects(copy).map((o) => o.id));
    expect(references(copied.content).every((r) => copyIds.has(r.objectId))).toBe(true);
    removeObject(b, { kind: 'entity', id: chosen[0].id });
    expect(() => validateBundle(b)).not.toThrow();
    expect(references(b.documents.find((d) => d.unitId === unit.id)!.content)[0].label).toBe(
      chosen[0].label
    );
  });
  it('populates child moments in reading order without overwriting prose or duplicating references, then expands reversibly', () => {
    const b = demoProject();
    const chapter = unitSchema.parse({
      ...base(),
      title: 'Chapter One',
      type: 'chapter',
      rank: 8000
    });
    b.units.push(chapter);
    const scenes = b.units.filter((u) => u.type === 'scene').slice(0, 2);
    scenes.forEach((u, i) => {
      u.parentId = chapter.id;
      u.rank = i * 1024;
    });
    saveDocument(b, chapter.id, {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Keep my introduction.' }] }]
    });
    expect(populateOutline(b, chapter.id)).toBe(2);
    expect(populateOutline(b, chapter.id)).toBe(0);
    const original = JSON.parse(JSON.stringify(b));
    const doc = b.documents.find((d) => d.unitId === chapter.id)!;
    expect(references(doc.content).map((r) => r.objectId)).toEqual(scenes.map((u) => u.id));
    saveDocument(b, chapter.id, expandReferences(b, doc.content));
    expect(b.documents.find((d) => d.unitId === chapter.id)!.text).toContain(
      'Keep my introduction.'
    );
    expect(b.documents.find((d) => d.unitId === chapter.id)!.text).toContain(scenes[0].title);
    expect(references(b.documents.find((d) => d.unitId === chapter.id)!.content)).toHaveLength(0);
    const restored = restoreKeepingProse(original, b, b);
    expect(
      references(restored.documents.find((d) => d.unitId === chapter.id)!.content)
    ).toHaveLength(2);
  });
});
describe('portable graph-to-writing context', () => {
  it('remaps creation-view and layout contexts on project copy', () => {
    const b = demoProject();
    const act = b.units.find((u) => u.type === 'act')!;
    const entity = b.entities[0];
    entity.metadata.canvasContext = 'narrative:' + act.id;
    b.layouts.push({ ...base(), objectId: entity.id, lens: 'narrative:' + act.id, x: 22, y: 44 });
    const copy = cloneProject(b);
    const copiedAct = copy.units.find((u) => u.title === act.title)!;
    const copiedEntity = copy.entities.find((e) => e.name === entity.name)!;
    expect(copiedEntity.metadata.canvasContext).toBe('narrative:' + copiedAct.id);
    expect(copy.layouts.find((l) => l.objectId === copiedEntity.id && l.x === 22)?.lens).toBe(
      'narrative:' + copiedAct.id
    );
  });
  it('retargets a writing reference when its possibility merges into another moment', () => {
    const b = demoProject();
    const source = b.units.find((u) => u.unresolved)!;
    const target = b.units.find((u) => u.type === 'scene' && !u.unresolved)!;
    const chapter = b.units.find((u) => u.type === 'act')!;
    saveDocument(b, chapter.id, {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'storyReference',
              attrs: { objectId: source.id, kind: 'unit', label: source.title }
            }
          ]
        }
      ]
    });
    mergePlaceholder(b, source.id, target.id);
    expect(references(b.documents.find((d) => d.unitId === chapter.id)!.content)[0].objectId).toBe(
      target.id
    );
    expect(() => validateBundle(b)).not.toThrow();
  });
});
describe('writing preservation', () => {
  it('keeps writing notes authored after a graph action across undo and redo', () => {
    const target = demoProject();
    const current = structuredClone(target);
    const unit = current.units.find((u) => u.type === 'scene')!;
    current.entities[0].summary = 'A graph edit';
    const command = structuredClone(current);
    unit.metadata.writingNotes = 'Keep this late planning note.';
    const restored = restoreKeepingProse(target, current, command);
    expect(restored.units.find((u) => u.id === unit.id)!.metadata.writingNotes).toBe(
      'Keep this late planning note.'
    );
    expect(
      restoreKeepingProse(command, restored, target).units.find((u) => u.id === unit.id)!.metadata
        .writingNotes
    ).toBe('Keep this late planning note.');
  });
  it('preserves earlier entity mention records when adding a new typed placeholder', () => {
    const b = demoProject();
    const unit = b.units.find((u) => u.type === 'scene')!;
    saveDocument(b, unit.id, {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: '@Mara' }] }]
    });
    const doc = b.documents.find((d) => d.unitId === unit.id)!;
    b.mentions.push({ ...base(), documentId: doc.id, entityId: b.entities[0].id });
    saveDocument(b, unit.id, {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'storyReference',
              attrs: { objectId: b.entities[1].id, kind: 'entity', label: b.entities[1].name }
            }
          ]
        }
      ]
    });
    expect(b.mentions.filter((m) => m.documentId === doc.id).map((m) => m.entityId)).toEqual([
      b.entities[0].id,
      b.entities[1].id
    ]);
  });
});
describe('graph anchors and bulk descriptions', () => {
  it('keeps handle identity when moved and falls back when an anchor is removed', () => {
    const b = demoProject();
    const relation = b.relationships[0];
    const source = b.entities.find((e) => e.id === relation.sourceId)!;
    const target = b.entities.find((e) => e.id === relation.targetId)!;
    source.metadata.anchors = { sourceSide: 'bottom', targetSide: 'top', count: 3 };
    target.metadata.anchors = { sourceSide: 'right', targetSide: 'left', count: 3 };
    relation.metadata.connection = { sourceHandle: 'source-3', targetHandle: 'target-2' };
    expect(edgeAnchors(b, source.id, target.id, relation.metadata)).toEqual({
      sourceHandle: 'source-3',
      targetHandle: 'target-2'
    });
    source.metadata.anchors = { sourceSide: 'top', targetSide: 'bottom', count: 1 };
    expect(edgeAnchors(b, source.id, target.id, relation.metadata).sourceHandle).toBeNull();
  });
  it('persists removal of sequence lines while keeping both moments and reading order', () => {
    const b = demoProject();
    const c = {
      lens: 'narrative' as const,
      parentId: b.units.find((u) => u.type === 'act')!.id,
      at: 1,
      temporal: false,
      threadIds: [],
      detail: 2
    };
    const edge = projectGraph(b, c).edges.find((e) => e.data.kind === 'sequence')!;
    b.units.find((u) => u.id === edge.source)!.metadata.sequenceBreaks = [edge.target];
    expect(projectGraph(b, c).edges.some((e) => e.id === edge.id)).toBe(false);
    expect(projectGraph(b, c).nodes.some((n) => n.id === edge.target)).toBe(true);
  });
  it('accepts summaries and full descriptions with blank facet overrides or default-only rows', () => {
    const a = parseEntityBatch('Mira | | A navigator | Her longer history', 'character, faction');
    expect(a.errors).toEqual([]);
    expect(a.rows[0].entity).toMatchObject({
      facets: ['character', 'faction'],
      summary: 'A navigator',
      description: 'Her longer history'
    });
    const b = parseEntityBatch('Mira | A navigator | Her longer history', 'character', [], true);
    expect(b.errors).toEqual([]);
    expect(b.rows[0].entity).toMatchObject({
      facets: ['character'],
      summary: 'A navigator',
      description: 'Her longer history'
    });
  });
});

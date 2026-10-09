import type { Bundle, Selection } from './model';
import { siblings, storyOrder, narrativeOrder } from './order';
import { resolveRelationshipState } from './state';
import { facetIcon, presentation } from './presentation';
import { anchors, edgeAnchors, type Anchors } from './anchors';
import type { StoryFolder } from './organization';

export const lenses = ['narrative', 'world', 'relationships', 'threads', 'chronology'] as const;
export type Lens = (typeof lenses)[number];
export type GraphNode = {
  id: string;
  position: { x: number; y: number };
  data: {
    title: string;
    subtitle: string;
    summary: string;
    kind: Selection['kind'];
    unresolved: boolean;
    threads: { name: string; color: string }[];
    current: boolean;
    detail: number;
    icon: StoryFolder['icon'];
    accent: string;
    anchors: Anchors;
  };
};
export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: 'sequence' | 'semantic';
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data: {
    label: string;
    kind: 'sequence' | 'relationship' | 'link';
    objectId?: string;
    parentId?: string | null;
  };
};
export type ProjectionContext = {
  lens: Lens;
  at: number;
  atOrder?: number;
  temporal: boolean;
  parentId: string | null;
  threadIds: string[];
  detail: number;
};
export function projectGraph(
  b: Bundle,
  c: ProjectionContext
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const records = new Map(
    [...b.entities, ...b.units, ...b.events, ...b.threads].map((object) => [object.id, object])
  );
  const threadIds = (id: string) =>
    b.threadMemberships.filter((m) => m.objectId === id).map((m) => m.threadId);
  const inThread = (id: string) =>
    !c.threadIds.length || threadIds(id).some((id) => c.threadIds.includes(id));
  const node = (
    id: string,
    title: string,
    subtitle: string,
    summary: string,
    kind: Selection['kind'],
    x: number,
    y: number,
    unresolved = false,
    current = false
  ) => {
    const record = records.get(id);
    const style = presentation(
      record?.metadata ?? {},
      record && 'facets' in record
        ? facetIcon(record.facets)
        : kind === 'unit'
          ? 'book'
          : kind === 'thread'
            ? 'flag'
            : 'sparkles',
      record && 'color' in record ? record.color : undefined
    );
    const layout = b.layouts.find(
      (l) => l.objectId === id && l.lens === `${c.lens}:${c.parentId ?? 'root'}`
    );
    nodes.push({
      id,
      position: layout ? { x: layout.x, y: layout.y } : { x, y },
      data: {
        title,
        subtitle,
        summary,
        kind,
        unresolved,
        current,
        detail: c.detail,
        icon: style.icon,
        accent: style.color,
        anchors: anchors(record?.metadata ?? {}),
        threads: b.threads
          .filter((t) => threadIds(id).includes(t.id))
          .map((t) => ({ name: t.name, color: t.color }))
      }
    });
  };
  if (['narrative', 'threads', 'chronology'].includes(c.lens)) {
    let units = c.lens === 'chronology' ? storyOrder(b) : siblings(b, c.parentId);
    if (c.lens === 'threads') units = narrativeOrder(b).filter((u) => u.type !== 'act');
    units = units.filter((u) => inThread(u.id));
    units.forEach((u, i) =>
      node(
        u.id,
        u.title,
        u.storyTime === null
          ? `${u.type} · ${b.units.filter((v) => v.parentId === u.id).length} moments`
          : `${u.type} · ${u.timeLabel || `Story ${u.storyTime}`}`,
        u.synopsis,
        'unit',
        i * 330,
        c.lens === 'threads' ? (i % 2) * 100 : 0,
        u.unresolved,
        u.storyTime === c.at
      )
    );
    for (let i = 1; i < units.length; i++) {
      const breaks = units[i - 1].metadata.sequenceBreaks;
      if (Array.isArray(breaks) && breaks.includes(units[i].id)) continue;
      edges.push({
        id: `sequence:${units[i - 1].id}:${units[i].id}`,
        source: units[i - 1].id,
        target: units[i].id,
        type: 'sequence',
        data: {
          label: c.lens === 'chronology' ? 'story time' : 'then',
          kind: 'sequence',
          parentId: c.parentId
        }
      });
    }
    if (c.lens === 'threads') {
      const related = b.relationships.filter((r) => inThread(r.id));
      const entities = b.entities.filter(
        (e) => inThread(e.id) || related.some((r) => r.sourceId === e.id || r.targetId === e.id)
      );
      entities.forEach((e, i) =>
        node(e.id, e.name, e.facets.join(' · '), e.summary, 'entity', i * 330, 320, e.unresolved)
      );
      b.events
        .filter((e) => inThread(e.id))
        .forEach((e, i) =>
          node(
            e.id,
            e.title,
            `event · Story ${e.storyTime}`,
            e.description,
            'event',
            i * 330,
            570,
            false,
            e.storyTime === c.at &&
              (c.atOrder === undefined || c.atOrder === Infinity || c.atOrder === e.order)
          )
        );
      for (const r of related) {
        const state = resolveRelationshipState(b, r.id, c.at, c.atOrder);
        if (c.temporal && b.relationshipStates.some((s) => s.relationshipId === r.id) && !state)
          continue;
        edges.push({
          ...edgeAnchors(b, r.sourceId, r.targetId, r.metadata),
          id: r.id,
          source: r.sourceId,
          target: r.targetId,
          type: 'semantic',
          data: { label: state?.label || r.label || r.type, kind: 'relationship', objectId: r.id }
        });
      }
    }
  } else {
    const visible = b.entities.filter(
      (e) =>
        inThread(e.id) &&
        (c.lens !== 'relationships' ||
          b.relationships.some((r) => r.sourceId === e.id || r.targetId === e.id))
    );
    visible.forEach((e, i) =>
      node(
        e.id,
        e.name,
        e.facets.join(' · '),
        e.summary,
        'entity',
        (i % 3) * 330,
        Math.floor(i / 3) * 210,
        e.unresolved
      )
    );
    for (const r of b.relationships) {
      const state = resolveRelationshipState(b, r.id, c.at, c.atOrder);
      const history = b.relationshipStates
        .filter((s) => s.relationshipId === r.id)
        .sort((a, d) => a.from - d.from)
        .map((s) => s.label);
      if (c.temporal && history.length && !state) continue;
      edges.push({
        ...edgeAnchors(b, r.sourceId, r.targetId, r.metadata),
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        type: 'semantic',
        data: {
          label: c.temporal
            ? state?.label || r.label || r.type
            : history.join(' → ') || r.label || r.type,
          kind: 'relationship',
          objectId: r.id
        }
      });
    }
  }
  const visible = new Set(nodes.map((n) => n.id));
  for (const record of records.values()) {
    if (
      visible.has(record.id) ||
      record.metadata.canvasContext !== c.lens + ':' + (c.parentId ?? 'root') ||
      !inThread(record.id)
    )
      continue;
    const kind =
      'facets' in record
        ? 'entity'
        : 'parentId' in record
          ? 'unit'
          : 'storyTime' in record
            ? 'event'
            : 'thread';
    node(
      record.id,
      'name' in record ? record.name : record.title,
      kind,
      'synopsis' in record
        ? record.synopsis
        : 'summary' in record
          ? record.summary
          : record.description,
      kind,
      0,
      220
    );
  }
  const ids = new Set(nodes.map((n) => n.id));
  // Cross-kind creations can add entity cards to another lens. Keep their canonical relationships visible.
  for (const r of b.relationships) {
    if (!ids.has(r.sourceId) || !ids.has(r.targetId) || edges.some((e) => e.id === r.id)) continue;
    const state = resolveRelationshipState(b, r.id, c.at, c.atOrder);
    if (c.temporal && b.relationshipStates.some((s) => s.relationshipId === r.id) && !state)
      continue;
    edges.push({
      ...edgeAnchors(b, r.sourceId, r.targetId, r.metadata),
      id: r.id,
      source: r.sourceId,
      target: r.targetId,
      type: 'semantic',
      data: { label: state?.label || r.label || r.type, kind: 'relationship', objectId: r.id }
    });
  }
  for (const l of b.links)
    if (ids.has(l.sourceId) && ids.has(l.targetId))
      edges.push({
        ...edgeAnchors(b, l.sourceId, l.targetId, l.metadata),
        id: l.id,
        source: l.sourceId,
        target: l.targetId,
        type: 'semantic',
        data: { label: l.type, kind: 'link', objectId: l.id }
      });
  return { nodes, edges: edges.filter((e) => ids.has(e.source) && ids.has(e.target)) };
}

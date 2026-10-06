import {
  base,
  entitySchema,
  eventSchema,
  validateBundle,
  type Bundle,
  type Json,
  type Selection
} from './model';
import { breadcrumbs, siblings } from './order';
import { organization, writeOrganization } from './organization';
import { addMembership } from './operations';

/** Preserve the narrative envelope and its connections when an unknown becomes concrete. */
export function resolvePlaceholder(
  b: Bundle,
  unitId: string,
  kind: 'scene' | 'entity' | 'event',
  name: string,
  facets: string[] = ['character']
): Selection {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit?.unresolved) throw new Error('Choose an unresolved moment.');
  unit.unresolved = false;
  unit.title = name.trim();
  if (kind === 'scene') {
    unit.type = 'scene';
    return { kind: 'unit', id: unit.id };
  }
  if (kind === 'entity') {
    const entity = entitySchema.parse({ ...base(), name, facets, summary: unit.synopsis });
    b.entities.push(entity);
    addMembership(b, unitId, entity.id);
    unit.type = 'note';
    return { kind: 'entity', id: entity.id };
  }
  const event = eventSchema.parse({
    ...base(),
    title: name,
    description: unit.synopsis,
    unitId,
    storyTime: unit.storyTime ?? 0
  });
  b.events.push(event);
  unit.type = 'beat';
  return { kind: 'event', id: event.id };
}

/** Merge into an existing narrative unit without discarding prose, history, or children. */
export function mergePlaceholder(b: Bundle, sourceId: string, targetId: string) {
  const source = b.units.find((u) => u.id === sourceId);
  const target = b.units.find((u) => u.id === targetId);
  if (!source?.unresolved || !target || sourceId === targetId)
    throw new Error('Choose another narrative moment.');
  if (breadcrumbs(b, targetId).some((u) => u.id === sourceId))
    throw new Error('An idea cannot merge into its own descendant.');
  let rank = siblings(b, targetId).at(-1)?.rank ?? 0;
  for (const child of siblings(b, sourceId)) {
    child.parentId = targetId;
    child.rank = rank += 1024;
  }
  for (const child of b.units.filter((u) => u.parentId === sourceId)) child.parentId = targetId;
  for (const list of [b.events, b.changes, b.relationshipStates, b.memberships])
    for (const record of list) if (record.unitId === sourceId) record.unitId = targetId;
  const fromDoc = b.documents.find((d) => d.unitId === sourceId);
  const toDoc = b.documents.find((d) => d.unitId === targetId);
  if (fromDoc && toDoc) {
    const children = (content: Json): Json[] => {
      if (
        content &&
        typeof content === 'object' &&
        !Array.isArray(content) &&
        Array.isArray(content.content)
      )
        return content.content;
      return [];
    };
    toDoc.content = {
      type: 'doc',
      content: [...children(toDoc.content), ...children(fromDoc.content)]
    };
    toDoc.text = [toDoc.text, fromDoc.text].filter(Boolean).join('\n\n');
    for (const mention of b.mentions)
      if (mention.documentId === fromDoc.id) mention.documentId = toDoc.id;
    b.documents = b.documents.filter((d) => d.id !== fromDoc.id);
  } else if (fromDoc) fromDoc.unitId = targetId;
  if (source.synopsis)
    target.synopsis = [target.synopsis, source.synopsis].filter(Boolean).join('\n\n');
  const archived = target.metadata.mergedNarrativeUnits;
  target.metadata.mergedNarrativeUnits = [
    ...(Array.isArray(archived) ? archived : []),
    JSON.parse(JSON.stringify(source)) as Json
  ];
  for (const m of b.threadMemberships) if (m.objectId === sourceId) m.objectId = targetId;
  for (const link of b.links) {
    if (link.sourceId === sourceId) link.sourceId = targetId;
    if (link.targetId === sourceId) link.targetId = targetId;
  }
  const unique = <T>(records: T[], key: (r: T) => string) => {
    const seen = new Set<string>();
    return records.filter((r) => {
      const id = key(r);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };
  b.memberships = unique(b.memberships, (m) => `${m.unitId}:${m.entityId}:${m.role}`);
  b.threadMemberships = unique(b.threadMemberships, (m) => `${m.threadId}:${m.objectId}`);
  b.mentions = unique(b.mentions, (m) => `${m.documentId}:${m.entityId}`);
  b.links = unique(
    b.links.filter((l) => l.sourceId !== l.targetId),
    (l) => `${l.sourceId}:${l.targetId}:${l.type}`
  );
  b.layouts = b.layouts.filter((l) => l.objectId !== sourceId);
  b.units = b.units.filter((u) => u.id !== sourceId);
  if (b.project.settings.organization) {
    const o = organization(b);
    const targetPlaced = o.placements.some((p) => p.objectId === targetId);
    o.placements = o.placements
      .filter((p) => !(p.objectId === sourceId && targetPlaced))
      .map((p) => (p.objectId === sourceId ? { ...p, objectId: targetId } : p));
    o.collapsedUnits = o.collapsedUnits.filter((id) => id !== sourceId);
    writeOrganization(b, o);
  }
  validateBundle(b);
}

import { base, collections, validateBundle, type Bundle, type Selection } from './model';
import { cloneJson } from './clone';

export function cloneProject(input: Bundle, title = `${input.project.title} (copy)`): Bundle {
  const b = cloneJson(input);
  const map = new Map<string, string>();
  map.set(b.project.id, crypto.randomUUID());
  for (const key of collections)
    for (const record of b[key]) map.set(record.id, crypto.randomUUID());
  const referenceFields = new Set([
    'id',
    'parentId',
    'povId',
    'sourceId',
    'targetId',
    'unitId',
    'eventId',
    'entityId',
    'threadId',
    'objectId',
    'relationshipId',
    'subjectId',
    'documentId'
  ]);
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
          key,
          referenceFields.has(key) && typeof val === 'string'
            ? (map.get(val) ?? val)
            : key === 'metadata' || key === 'content'
              ? val
              : walk(val)
        ])
      );
    return value;
  };
  const copy = walk(b) as Bundle;
  copy.project.title = title;
  copy.project.revision = 0;
  copy.project.createdAt = copy.project.updatedAt = new Date().toISOString();
  return validateBundle(copy);
}
export function deleteImpact(b: Bundle, selected: Selection) {
  const copy = cloneJson(b);
  const before = collections.reduce((n, k) => n + b[k].length, 0);
  removeObject(copy, selected);
  return before - collections.reduce((n, k) => n + copy[k].length, 0) - 1;
}
export function removeObject(b: Bundle, selected: Selection) {
  const removed = new Set([selected.id]);
  if (selected.kind === 'unit') {
    let added = true;
    while (added) {
      added = false;
      for (const u of b.units)
        if (u.parentId && removed.has(u.parentId) && !removed.has(u.id)) {
          removed.add(u.id);
          added = true;
        }
    }
  }
  for (const r of b.relationships)
    if (removed.has(r.sourceId) || removed.has(r.targetId)) removed.add(r.id);
  for (const e of b.events) if (e.unitId && removed.has(e.unitId)) removed.add(e.id);
  for (const d of b.documents) if (removed.has(d.unitId)) removed.add(d.id);
  b.entities = b.entities.filter((e) => !removed.has(e.id));
  b.units = b.units
    .filter((u) => !removed.has(u.id))
    .map((u) => ({ ...u, povId: u.povId && removed.has(u.povId) ? null : u.povId }));
  b.relationships = b.relationships.filter((r) => !removed.has(r.id));
  b.events = b.events
    .filter((e) => !removed.has(e.id))
    .map((e) => ({
      ...e,
      requirements: e.requirements.filter(
        (r) => !removed.has(r.subjectId) && !(r.targetId && removed.has(r.targetId))
      )
    }));
  b.relationshipStates = b.relationshipStates.filter(
    (s) =>
      !removed.has(s.relationshipId) &&
      !(s.unitId && removed.has(s.unitId)) &&
      !(s.eventId && removed.has(s.eventId))
  );
  b.changes = b.changes.filter(
    (c) =>
      !removed.has(c.subjectId) &&
      !(c.targetId && removed.has(c.targetId)) &&
      !(c.unitId && removed.has(c.unitId)) &&
      !(c.eventId && removed.has(c.eventId))
  );
  b.threads = b.threads.filter((t) => !removed.has(t.id));
  b.memberships = b.memberships.filter((m) => !removed.has(m.unitId) && !removed.has(m.entityId));
  b.threadMemberships = b.threadMemberships.filter(
    (m) => !removed.has(m.threadId) && !removed.has(m.objectId)
  );
  b.links = b.links.filter((l) => !removed.has(l.sourceId) && !removed.has(l.targetId));
  b.documents = b.documents.filter((d) => !removed.has(d.id));
  b.mentions = b.mentions.filter((m) => !removed.has(m.documentId) && !removed.has(m.entityId));
  b.layouts = b.layouts.filter((l) => !removed.has(l.objectId));
}
export function addMembership(b: Bundle, unitId: string, entityId: string) {
  if (b.memberships.some((m) => m.unitId === unitId && m.entityId === entityId)) return;
  const entity = b.entities.find((e) => e.id === entityId);
  b.memberships.push({
    ...base(),
    unitId,
    entityId,
    role: entity?.facets.includes('location')
      ? 'setting'
      : entity?.facets.includes('item')
        ? 'involved'
        : 'present'
  });
}
export function restoreKeepingProse(
  target: Bundle,
  current: Bundle,
  commandState?: Bundle
): Bundle {
  const restored = cloneJson(target);
  const unitIds = new Set(restored.units.map((u) => u.id));
  const currentDocuments = current.documents
    .filter((d) => unitIds.has(d.unitId))
    .map((d) => {
      const previous = target.documents.find((p) => p.unitId === d.unitId);
      const command = commandState?.documents.find((p) => p.unitId === d.unitId);
      const body = (doc: typeof d | undefined) =>
        doc ? JSON.stringify([doc.content, doc.text]) : null;
      // A graph command can deliberately join prose. Undo that join only if no later writing replaced it.
      if (commandState && previous && body(previous) !== body(command) && body(d) === body(command))
        return previous;
      return d;
    });
  const currentUnits = new Set(currentDocuments.map((d) => d.unitId));
  restored.documents = [
    ...currentDocuments,
    ...restored.documents.filter((d) => !currentUnits.has(d.unitId))
  ];
  const documentIds = new Set(restored.documents.map((d) => d.id));
  const entityIds = new Set(restored.entities.map((e) => e.id));
  const seen = new Set<string>();
  restored.mentions = [...current.mentions, ...restored.mentions].filter((m) => {
    const key = `${m.documentId}:${m.entityId}`;
    if (seen.has(key) || !documentIds.has(m.documentId) || !entityIds.has(m.entityId)) return false;
    seen.add(key);
    return true;
  });
  return validateBundle(restored);
}
export function markdownExport(b: Bundle): string {
  const walk = (parent: string | null, level: number): string =>
    b.units
      .filter((u) => u.parentId === parent && !u.unplaced)
      .sort((a, c) => a.rank - c.rank)
      .map(
        (u) =>
          `${'#'.repeat(Math.min(level, 6))} ${u.title}\n\n${b.documents.find((d) => d.unitId === u.id)?.text || u.synopsis}\n\n${walk(u.id, level + 1)}`
      )
      .join('');
  return `# ${b.project.title}\n\n${b.project.description}\n\n${walk(null, 2)}`;
}

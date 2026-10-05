import type { Bundle, Change, Json, RelationshipState } from './model';

export const stateKey = (subject: string, key: string, target: string | null) =>
  `${subject}:${key}:${target ?? ''}`;
export const compareChanges = (a: Change, b: Change) =>
  a.storyTime - b.storyTime || a.order - b.order || a.id.localeCompare(b.id);
export function resolveRelationshipState(
  b: Bundle,
  relationshipId: string,
  at: number,
  order = Infinity
): RelationshipState | undefined {
  const latest = b.relationshipStates
    .filter(
      (s) =>
        s.relationshipId === relationshipId &&
        (s.from < at ||
          (s.from === at && (b.events.find((e) => e.id === s.eventId)?.order ?? 0) <= order))
    )
    .sort(
      (a, c) =>
        c.from - a.from ||
        (b.events.find((e) => e.id === c.eventId)?.order ?? 0) -
          (b.events.find((e) => e.id === a.eventId)?.order ?? 0) ||
        c.id.localeCompare(a.id)
    )[0];
  return latest && (latest.until === null || at < latest.until) ? latest : undefined;
}
export function resolveStoryState(b: Bundle, at: number, before = false, order = Infinity) {
  const properties: Record<string, Json> = {};
  for (const change of [...b.changes].sort(compareChanges)) {
    if (before ? change.storyTime >= at : change.storyTime > at) continue;
    if (change.storyTime === at && change.order > order) continue;
    properties[stateKey(change.subjectId, change.key, change.targetId)] = change.value;
  }
  const relationships: Record<string, RelationshipState> = {};
  for (const r of b.relationships) {
    const state = resolveRelationshipState(b, r.id, at, before ? -Infinity : order);
    if (state) relationships[r.id] = state;
  }
  return { properties, relationships };
}
export function valueBefore(
  b: Bundle,
  change: Pick<Change, 'subjectId' | 'key' | 'targetId' | 'storyTime' | 'order' | 'id'>
): Json {
  let value: Json = null;
  for (const c of [...b.changes].sort(compareChanges)) {
    if (compareChanges(c, change as Change) >= 0) break;
    if (
      stateKey(c.subjectId, c.key, c.targetId) ===
      stateKey(change.subjectId, change.key, change.targetId)
    )
      value = c.value;
  }
  return value;
}
export function sceneDiff(b: Bundle, unitId: string) {
  return b.changes
    .filter((c) => c.unitId === unitId)
    .sort(compareChanges)
    .map((c) => ({ ...c, previous: c.before !== null ? c.before : valueBefore(b, c) }));
}

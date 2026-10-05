import type { Bundle, Selection } from './model';

export function objectSelection(b: Bundle, id: string): Selection | undefined {
  if (b.units.some((u) => u.id === id)) return { kind: 'unit', id };
  if (b.entities.some((e) => e.id === id)) return { kind: 'entity', id };
  if (b.events.some((e) => e.id === id)) return { kind: 'event', id };
  if (b.relationships.some((r) => r.id === id)) return { kind: 'relationship', id };
  if (b.threads.some((t) => t.id === id)) return { kind: 'thread', id };
}
export function objectName(b: Bundle, id: string): string {
  return (
    b.units.find((u) => u.id === id)?.title ??
    b.entities.find((e) => e.id === id)?.name ??
    b.events.find((e) => e.id === id)?.title ??
    b.relationships.find((r) => r.id === id)?.label ??
    b.threads.find((t) => t.id === id)?.name ??
    'Story object'
  );
}

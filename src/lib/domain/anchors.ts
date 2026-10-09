import { z } from 'zod';
import type { Json, Bundle } from './model';
export const sides = ['left', 'right', 'top', 'bottom'] as const;
export const anchorSchema = z.object({
  sourceSide: z.enum(sides).default('right'),
  targetSide: z.enum(sides).default('left'),
  count: z.number().int().min(1).max(4).default(1)
});
export function anchors(metadata: Record<string, Json>) {
  const result = anchorSchema.safeParse(metadata.anchors ?? {});
  return result.success ? result.data : anchorSchema.parse({});
}
export type Anchors = ReturnType<typeof anchors>;
export function validHandle(
  id: unknown,
  type: 'source' | 'target',
  metadata: Record<string, Json>
): string | null {
  if (typeof id !== 'string') return null;
  const index = Number(id.replace(type + '-', ''));
  return id.startsWith(type + '-') &&
    Number.isInteger(index) &&
    index >= 2 &&
    index <= anchors(metadata).count
    ? id
    : null;
}
export function edgeAnchors(
  b: Bundle,
  sourceId: string,
  targetId: string,
  metadata: Record<string, Json>
) {
  const objects = [...b.units, ...b.entities, ...b.events, ...b.threads];
  const stored = metadata.connection;
  const connection = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  return {
    sourceHandle: validHandle(
      connection.sourceHandle,
      'source',
      objects.find((o) => o.id === sourceId)?.metadata ?? {}
    ),
    targetHandle: validHandle(
      connection.targetHandle,
      'target',
      objects.find((o) => o.id === targetId)?.metadata ?? {}
    )
  };
}

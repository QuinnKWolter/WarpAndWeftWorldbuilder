import type { Bundle, Unit } from './model';

export const siblings = (b: Bundle, parentId: string | null) => b.units.filter((u) => !u.unplaced && u.parentId === parentId).sort((a,b) => a.rank - b.rank || a.id.localeCompare(b.id));
export function narrativeOrder(b: Bundle): Unit[] {
  const result: Unit[] = [];
  const walk = (parent: string | null) => { for (const unit of siblings(b, parent)) { result.push(unit); walk(unit.id); } };
  walk(null); return result;
}
export const storyOrder = (b: Bundle) => b.units.filter((u) => !u.unplaced && u.storyTime !== null).sort((a,b) => (a.storyTime ?? 0) - (b.storyTime ?? 0) || a.rank - b.rank || a.id.localeCompare(b.id));
export function rankBetween(before?: Unit, after?: Unit): number {
  if (!before) return after ? after.rank - 1024 : 1024;
  if (!after) return before.rank + 1024;
  return (before.rank + after.rank) / 2;
}
export function placeUnit(b: Bundle, unitId: string, parentId: string | null, beforeId: string | null) {
  const unit = b.units.find((u) => u.id === unitId);
  if (!unit) throw new Error('Scene not found.');
  let parent = parentId;
  while (parent) { if (parent === unitId) throw new Error('A scene cannot contain itself.'); parent = b.units.find((u) => u.id === parent)?.parentId ?? null; }
  let list = siblings(b, parentId).filter((u) => u.id !== unitId);
  let index = beforeId ? list.findIndex((u) => u.id === beforeId) : list.length;
  if (index < 0) throw new Error('Insertion point not found.');
  if (index > 0 && index < list.length && list[index].rank - list[index - 1].rank < 0.0001) {
    list.forEach((u, i) => u.rank = (i + 1) * 1024); list = siblings(b, parentId).filter((u) => u.id !== unitId); index = beforeId ? list.findIndex((u) => u.id === beforeId) : list.length;
  }
  unit.parentId = parentId; unit.unplaced = false; unit.rank = rankBetween(list[index - 1], list[index]);
}
export function breadcrumbs(b: Bundle, unitId: string): Unit[] {
  const result: Unit[] = []; let unit = b.units.find((u) => u.id === unitId);
  while (unit) { result.unshift(unit); unit = b.units.find((u) => u.id === unit?.parentId); }
  return result;
}

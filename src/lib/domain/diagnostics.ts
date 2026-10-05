import type { Bundle, Selection } from './model';
import { narrativeOrder } from './order';
import { compareChanges, stateKey } from './state';

export type Diagnostic = { id: string; severity: 'warning' | 'info'; rule: string; message: string; selection: Selection };
export function diagnose(b: Bundle): Diagnostic[] {
  const issues: Diagnostic[] = [];
  const entityName = (id: string) => b.entities.find((e) => e.id === id)?.name ?? 'Missing entity';
  const sequence = narrativeOrder(b); const indices = new Map(sequence.map((u,i) => [u.id,i]));
  for (const event of b.events) for (const requirement of event.requirements) {
    const key = stateKey(requirement.subjectId,requirement.key,requirement.targetId);
    const prior = b.changes.filter((c) => stateKey(c.subjectId,c.key,c.targetId) === key && (c.storyTime < event.storyTime || c.storyTime === event.storyTime && c.order < event.order)).sort(compareChanges).at(-1);
    if (JSON.stringify(prior?.value ?? null) !== JSON.stringify(requirement.value)) issues.push({ id: `${event.id}:${key}`, severity: 'warning', rule: 'state-requirement', message: `${entityName(requirement.subjectId)} needs ${requirement.key}${requirement.targetId ? ` of ${entityName(requirement.targetId)}` : ''} = ${String(requirement.value)} for “${event.title}”, but this is not modeled before the event.`, selection: {kind:'event',id:event.id} });
    if (prior?.unitId && event.unitId && (indices.get(prior.unitId) ?? -1) > (indices.get(event.unitId) ?? -1)) issues.push({ id: `reveal:${event.id}:${key}`, severity:'info', rule:'reader-order', message: `“${event.title}” is presented before the scene that establishes its ${requirement.key}. This may be an intentional delayed reveal.`, selection:{kind:'event',id:event.id} });
  }
  for (const u of b.units) {
    if (u.unplaced || u.unresolved) issues.push({id:`unresolved:${u.id}`,severity:'info',rule:'unresolved',message:`“${u.title}” is ${u.unplaced ? 'still in the idea inbox' : 'an unresolved placeholder'}.`,selection:{kind:'unit',id:u.id}});
    if (u.setup && !b.links.some((l) => l.sourceId === u.id && ['pays off','resolves'].includes(l.type))) issues.push({id:`setup:${u.id}`,severity:'info',rule:'setup',message:`“${u.title}” has a setup with no recorded payoff.`,selection:{kind:'unit',id:u.id}});
  }
  for (const e of b.entities.filter((e) => e.unresolved)) issues.push({id:`ghost:${e.id}`,severity:'info',rule:'unresolved',message:`“${e.name}” is an unresolved world entity.`,selection:{kind:'entity',id:e.id}});
  for (const s of b.relationshipStates) if (!b.relationships.some((r) => r.id === s.relationshipId) || s.eventId && !b.events.some((e) => e.id === s.eventId)) issues.push({id:`dangling:${s.id}`,severity:'warning',rule:'dangling',message:'A relationship transition has a missing source.',selection:{kind:'relationship',id:s.relationshipId}});
  for (const e of b.entities) {
    const locations = b.memberships.filter((m) => m.entityId === e.id && m.role === 'present').flatMap((m) => {
      const unit = b.units.find((u) => u.id === m.unitId);
      return b.memberships.filter((l) => l.unitId === m.unitId && l.role === 'setting').map((l) => ({unit,location:l.entityId}));
    });
    for (let i=0;i<locations.length;i++) for (let j=i+1;j<locations.length;j++) {
      const a=locations[i],c=locations[j];
      if (a.unit && c.unit && a.unit.storyTime !== null && a.unit.storyTime === c.unit.storyTime && a.location !== c.location) issues.push({id:`location:${e.id}:${a.unit.id}:${c.unit.id}`,severity:'warning',rule:'location',message:`${e.name} is present at two different settings at the same story point.`,selection:{kind:'unit',id:c.unit.id}});
    }
  }
  return issues;
}

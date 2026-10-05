import { z } from 'zod';

const id = z.uuid();
const text = z.string().max(200000);
const name = z.string().trim().min(1).max(240);
const metadata = z.record(z.string(), z.json()).default({});
const point = z.number().finite();
const reference = id.nullable().default(null);
const core = { id, metadata };

export const entitySchema = z.object({
  ...core, name, summary: text.default(''), description: text.default(''),
  facets: z.array(name).max(30).default([]), unresolved: z.boolean().default(false)
});
export const unitSchema = z.object({
  ...core, title: name, type: name.default('scene'), parentId: reference,
  rank: point, storyTime: point.nullable().default(null), storyEnd: point.nullable().default(null),
  timeLabel: z.string().max(240).default(''), synopsis: text.default(''),
  povId: reference, status: z.enum(['idea', 'draft', 'revised', 'complete']).default('idea'),
  unresolved: z.boolean().default(false), unplaced: z.boolean().default(false),
  setup: z.boolean().default(false)
});
export const eventSchema = z.object({
  ...core, title: name, description: text.default(''), unitId: reference,
  storyTime: point, order: point.default(0),
  requirements: z.array(z.object({ subjectId: id, key: name, targetId: reference, value: z.json() })).default([])
});
export const relationshipSchema = z.object({
  ...core, sourceId: id, targetId: id, type: name.default('relationship'),
  label: z.string().max(240).default(''), description: text.default(''), directed: z.boolean().default(false)
});
export const relationshipStateSchema = z.object({
  ...core, relationshipId: id, from: point, until: point.nullable().default(null),
  label: name, dimensions: z.record(z.string(), point).default({}),
  unitId: reference, eventId: reference, note: text.default('')
});
export const changeSchema = z.object({
  ...core, subjectId: id, key: name, targetId: reference, before: z.json().default(null),
  value: z.json(), storyTime: point, order: point.default(0), unitId: reference, eventId: reference,
  note: text.default('')
});
export const threadSchema = z.object({ ...core, name, description: text.default(''), color: z.string().regex(/^#[0-9a-f]{6}$/i).default('#50856e') });
export const membershipSchema = z.object({ ...core, unitId: id, entityId: id, role: name.default('present') });
export const threadMembershipSchema = z.object({ ...core, threadId: id, objectId: id });
export const linkSchema = z.object({ ...core, sourceId: id, targetId: id, type: z.enum(['causes', 'enables', 'prevents', 'foreshadows', 'sets up', 'pays off', 'reveals', 'resolves']) });
export const documentSchema = z.object({ ...core, unitId: id, content: z.json(), text: text.default('') });
export const mentionSchema = z.object({ ...core, documentId: id, entityId: id });
export const layoutSchema = z.object({ ...core, lens: name, objectId: id, x: point, y: point });
export const projectSchema = z.object({
  ...core, title: name, description: text.default(''), createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(), revision: z.number().int().nonnegative().default(0),
  settings: metadata, ownerId: z.string().default('local')
});

export const bundleSchema = z.object({
  format: z.literal('storygraph'), version: z.literal(1), project: projectSchema,
  entities: z.array(entitySchema).max(10000), units: z.array(unitSchema).max(10000),
  events: z.array(eventSchema).max(50000), relationships: z.array(relationshipSchema).max(50000),
  relationshipStates: z.array(relationshipStateSchema).max(100000), changes: z.array(changeSchema).max(100000),
  threads: z.array(threadSchema).max(10000), memberships: z.array(membershipSchema).max(100000),
  threadMemberships: z.array(threadMembershipSchema).max(100000), links: z.array(linkSchema).max(50000),
  documents: z.array(documentSchema).max(10000), mentions: z.array(mentionSchema).max(100000),
  layouts: z.array(layoutSchema).max(50000)
});
export type Bundle = z.infer<typeof bundleSchema>;
export type Entity = z.infer<typeof entitySchema>;
export type Unit = z.infer<typeof unitSchema>;
export type StoryEvent = z.infer<typeof eventSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type RelationshipState = z.infer<typeof relationshipStateSchema>;
export type Change = z.infer<typeof changeSchema>;
export type Thread = z.infer<typeof threadSchema>;
export type Json = z.infer<ReturnType<typeof z.json>>;
export type Collection = Exclude<keyof Bundle, 'format' | 'version' | 'project'>;
export type ObjectKind = 'entity' | 'unit' | 'event' | 'relationship' | 'thread';
export type Selection = { kind: ObjectKind; id: string };
export const collections: Collection[] = ['entities', 'units', 'events', 'relationships', 'relationshipStates', 'changes', 'threads', 'memberships', 'threadMemberships', 'links', 'documents', 'mentions', 'layouts'];
export const uid = () => crypto.randomUUID();
export const base = () => ({ id: uid(), metadata: {} });

export function blankProject(title: string): Bundle {
  const now = new Date().toISOString();
  return bundleSchema.parse({ format: 'storygraph', version: 1,
    project: { ...base(), title, description: '', createdAt: now, updatedAt: now, settings: {}, revision: 0 },
    ...Object.fromEntries(collections.map((key) => [key, []])) });
}

/** Validate all cross-record references before an import or database transaction. */
export function validateBundle(input: unknown): Bundle {
  const b = bundleSchema.parse(input);
  const all = new Set<string>([b.project.id]);
  for (const key of collections) for (const record of b[key]) {
    if (all.has(record.id)) throw new Error('Duplicate record identifier.');
    all.add(record.id);
  }
  const entities = new Set(b.entities.map((e) => e.id));
  const units = new Set(b.units.map((u) => u.id));
  const events = new Set(b.events.map((e) => e.id));
  const relationships = new Set(b.relationships.map((r) => r.id));
  const threads = new Set(b.threads.map((t) => t.id));
  const documents = new Set(b.documents.map((d) => d.id));
  const objects = new Set([...entities, ...units, ...events, ...relationships, ...threads]);
  const ref = (value: string | null, set: Set<string>, field: string) => {
    if (value !== null && !set.has(value)) throw new Error(`Missing reference: ${field}.`);
  };
  for (const u of b.units) {
    ref(u.parentId, units, 'parent'); ref(u.povId, entities, 'POV');
    if (u.storyEnd !== null && u.storyTime !== null && u.storyEnd < u.storyTime) throw new Error('Scene end precedes its start.');
    const visited = new Set([u.id]); let parent = u.parentId;
    while (parent) {
      if (visited.has(parent)) throw new Error('Narrative hierarchy contains a cycle.');
      visited.add(parent); parent = b.units.find((item) => item.id === parent)?.parentId ?? null;
    }
  }
  for (const e of b.events) { ref(e.unitId, units, 'event scene'); for (const r of e.requirements) { ref(r.subjectId, entities, 'requirement subject'); ref(r.targetId, entities, 'requirement target'); } }
  for (const r of b.relationships) { ref(r.sourceId, entities, 'relationship source'); ref(r.targetId, entities, 'relationship target'); }
  for (const s of b.relationshipStates) {
    ref(s.relationshipId, relationships, 'relationship state'); ref(s.unitId, units, 'state scene'); ref(s.eventId, events, 'state event');
    if (s.until !== null && s.until <= s.from) throw new Error('Relationship interval must end after it begins.');
  }
  for (const c of b.changes) { ref(c.subjectId, entities, 'change subject'); ref(c.targetId, entities, 'change target'); ref(c.unitId, units, 'change scene'); ref(c.eventId, events, 'change event'); }
  for (const m of b.memberships) { ref(m.unitId, units, 'membership scene'); ref(m.entityId, entities, 'membership entity'); }
  for (const m of b.threadMemberships) { ref(m.threadId, threads, 'thread'); ref(m.objectId, objects, 'thread object'); }
  for (const l of b.links) { ref(l.sourceId, objects, 'link source'); ref(l.targetId, objects, 'link target'); }
  for (const d of b.documents) { ref(d.unitId, units, 'document scene'); validateDocument(d.content); }
  for (const m of b.mentions) { ref(m.documentId, documents, 'mention document'); ref(m.entityId, entities, 'mention entity'); }
  for (const l of b.layouts) ref(l.objectId, objects, 'layout object');
  const unique = (values: string[], label: string) => { if (new Set(values).size !== values.length) throw new Error(`Duplicate ${label}.`); };
  unique(b.documents.map((d) => d.unitId), 'scene document');
  unique(b.memberships.map((m) => `${m.unitId}:${m.entityId}:${m.role}`), 'scene membership');
  unique(b.threadMemberships.map((m) => `${m.threadId}:${m.objectId}`), 'thread membership');
  unique(b.layouts.map((l) => `${l.lens}:${l.objectId}`), 'layout position');
  return b;
}

const documentNode = z.object({ type: z.enum(['doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'codeBlock', 'hardBreak', 'horizontalRule']), text: z.string().optional(), attrs: z.record(z.string(), z.json()).optional(), marks: z.array(z.object({ type: z.enum(['bold', 'italic', 'strike', 'code', 'link', 'underline']), attrs: z.record(z.string(), z.json()).optional() })).optional() });
function validateDocument(content: Json, depth = 0): void {
  if (depth > 100) throw new Error('Document is nested too deeply.');
  const node = documentNode.parse(content);
  for (const mark of node.marks ?? []) if (mark.type === 'link') {
    const href = mark.attrs?.href;
    if (typeof href !== 'string' || !/^(https?:\/\/|mailto:|#)/i.test(href)) throw new Error('Document link uses an unsupported URL.');
  }
  const children = (content as Record<string, Json>).content;
  if (children !== undefined) { if (!Array.isArray(children)) throw new Error('Invalid document children.'); for (const child of children) validateDocument(child, depth + 1); }
}

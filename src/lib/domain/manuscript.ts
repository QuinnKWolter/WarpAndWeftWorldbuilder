import type { Bundle, Json, Selection, Unit } from './model';
import { base } from './model';
import { narrativeOrder, breadcrumbs } from './order';
import { objectName, objectSelection } from './objects';
export type DocumentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, Json>;
  marks?: { type: string; attrs?: Record<string, Json> }[];
  content?: DocumentNode[];
};
export const referenceSyntax = (kind: string, id: string, label: string) =>
  `{{story:${kind}:${id}|${encodeURIComponent(label)}}}`;
export function storyObjects(b: Bundle) {
  return [
    ...b.units.map((u) => ({
      kind: 'unit' as const,
      id: u.id,
      label: u.title,
      summary: u.synopsis
    })),
    ...b.entities.map((e) => ({
      kind: 'entity' as const,
      id: e.id,
      label: e.name,
      summary: e.summary || e.description
    })),
    ...b.events.map((e) => ({
      kind: 'event' as const,
      id: e.id,
      label: e.title,
      summary: e.description
    })),
    ...b.relationships.map((r) => ({
      kind: 'relationship' as const,
      id: r.id,
      label: r.label || `${objectName(b, r.sourceId)} ↔ ${objectName(b, r.targetId)}`,
      summary: r.description
    })),
    ...b.threads.map((t) => ({
      kind: 'thread' as const,
      id: t.id,
      label: t.name,
      summary: t.description
    }))
  ];
}
export function references(
  content: Json
): { objectId: string; kind: Selection['kind']; label: string }[] {
  const found: ReturnType<typeof references> = [];
  const walk = (node: DocumentNode) => {
    if (node.type === 'storyReference')
      found.push(node.attrs as unknown as ReturnType<typeof references>[number]);
    node.content?.forEach(walk);
  };
  walk(content as DocumentNode);
  return found;
}
export function proseText(content: Json): string {
  const render = (node: DocumentNode): string =>
    node.type === 'storyReference'
      ? ''
      : (node.text ??
        node.content
          ?.map(render)
          .join(
            ['doc', 'bulletList', 'orderedList', 'listItem', 'blockquote'].includes(node.type)
              ? '\n'
              : ''
          ) ??
        (node.type === 'hardBreak' ? '\n' : ''));
  return render(content as DocumentNode);
}
export function documentMarkdown(content: Json, includeReferences = false): string {
  const escape = (s: string) => s.replace(/([\\*`_[\]])/g, '\\$1');
  const render = (n: DocumentNode): string => {
    if (n.type === 'storyReference')
      return includeReferences
        ? referenceSyntax(String(n.attrs?.kind), String(n.attrs?.objectId), String(n.attrs?.label))
        : '';
    if (n.type === 'text') {
      let text = escape(n.text ?? '');
      for (const m of n.marks ?? []) {
        if (m.type === 'bold') text = '**' + text + '**';
        if (m.type === 'italic') text = '*' + text + '*';
        if (m.type === 'strike') text = '~~' + text + '~~';
        if (m.type === 'code') text = '`' + (n.text ?? '') + '`';
        if (m.type === 'link') text = '[' + text + '](' + m.attrs?.href + ')';
      }
      return text;
    }
    const children = n.content ?? [];
    if (n.type === 'doc') return children.map(render).join('\n\n');
    if (n.type === 'heading')
      return (
        '#'.repeat(Math.min(6, Number(n.attrs?.level ?? 1))) + ' ' + children.map(render).join('')
      );
    if (n.type === 'paragraph') return children.map(render).join('');
    if (n.type === 'hardBreak') return '  \n';
    if (n.type === 'horizontalRule') return '---';
    if (n.type === 'codeBlock')
      return (
        '```' +
        (n.attrs?.language ?? '') +
        '\n' +
        children.map((c) => c.text ?? '').join('') +
        '\n```'
      );
    if (n.type === 'blockquote')
      return children
        .map(render)
        .join('\n\n')
        .split('\n')
        .map((line) => '> ' + line)
        .join('\n');
    if (n.type === 'bulletList' || n.type === 'orderedList')
      return children
        .map((c, i) => {
          const marker = n.type === 'orderedList' ? Number(n.attrs?.start ?? 1) + i + '. ' : '- ';
          return (
            marker +
            render(c)
              .split('\n')
              .map((line, j) => (j ? ' '.repeat(marker.length) + line : line))
              .join('\n')
          );
        })
        .join('\n');
    return children.map(render).join('\n\n');
  };
  return render(content as DocumentNode).trim();
}
export function saveDocument(b: Bundle, unitId: string, content: Json, markdown?: string) {
  let doc = b.documents.find((d) => d.unitId === unitId);
  if (!doc) {
    doc = { ...base(), unitId, content, text: '' };
    b.documents.push(doc);
  }
  const previousReferences = new Set(
    references(doc.content)
      .filter((r) => r.kind === 'entity')
      .map((r) => r.objectId)
  );
  doc.content = content;
  doc.text = proseText(content);
  if (markdown !== undefined) doc.metadata.markdown = markdown;
  else delete doc.metadata.markdown;
  const entities = new Set(
    references(content)
      .filter((r) => r.kind === 'entity' && b.entities.some((e) => e.id === r.objectId))
      .map((r) => r.objectId)
  );
  b.mentions = b.mentions.filter(
    (m) =>
      m.documentId !== doc!.id || !previousReferences.has(m.entityId) || entities.has(m.entityId)
  );
  for (const entityId of entities)
    if (!b.mentions.some((m) => m.documentId === doc!.id && m.entityId === entityId))
      b.mentions.push({ ...base(), documentId: doc.id, entityId });
}
export function populateOutline(b: Bundle, unitId: string) {
  const document = b.documents.find((d) => d.unitId === unitId);
  const existing = new Set(document ? references(document.content).map((r) => r.objectId) : []);
  const units = narrativeOrder(b).filter(
    (u) => u.id !== unitId && breadcrumbs(b, u.id).some((p) => p.id === unitId)
  );
  const content = (document?.content as DocumentNode | undefined)?.content ?? [];
  const placeholders = units
    .filter((u) => !existing.has(u.id))
    .map((u) => ({
      type: 'paragraph',
      content: [{ type: 'storyReference', attrs: { objectId: u.id, kind: 'unit', label: u.title } }]
    }));
  if (!placeholders.length) return 0;
  saveDocument(b, unitId, { type: 'doc', content: [...content, ...placeholders] } as Json);
  return placeholders.length;
}
export function expandReferences(b: Bundle, content: Json): Json {
  const objects = storyObjects(b);
  const walk = (n: DocumentNode): DocumentNode => {
    if (n.type === 'storyReference') {
      const object = objects.find((o) => o.id === n.attrs?.objectId);
      return {
        type: 'text',
        text: object
          ? `${object.label}${object.summary ? ' — ' + object.summary : ''}`
          : `[Missing ${n.attrs?.label ?? 'story object'}]`
      };
    }
    return { ...n, ...(n.content ? { content: n.content.map(walk) } : {}) };
  };
  return walk(content as DocumentNode) as Json;
}
export function chapterSummary(b: Bundle, unit: Unit) {
  const units = [
    unit,
    ...narrativeOrder(b).filter(
      (u) => u.id !== unit.id && breadcrumbs(b, u.id).some((p) => p.id === unit.id)
    )
  ];
  const ids = new Set(units.map((u) => u.id));
  const entities = b.entities.filter((e) =>
    b.memberships.some((m) => ids.has(m.unitId) && m.entityId === e.id)
  );
  const entityIds = new Set(entities.map((e) => e.id));
  return {
    units,
    entities,
    events: b.events.filter((e) => !!e.unitId && ids.has(e.unitId)),
    relationships: b.relationships.filter(
      (r) => entityIds.has(r.sourceId) || entityIds.has(r.targetId)
    ),
    threads: b.threads.filter((t) =>
      b.threadMemberships.some(
        (m) => m.threadId === t.id && (ids.has(m.objectId) || entityIds.has(m.objectId))
      )
    )
  };
}
export function remapDocumentReferences(content: Json, map: Map<string, string>): Json {
  const walk = (n: DocumentNode): DocumentNode => ({
    ...n,
    ...(n.type === 'storyReference' && n.attrs
      ? { attrs: { ...n.attrs, objectId: map.get(String(n.attrs.objectId)) ?? n.attrs.objectId } }
      : {}),
    ...(n.content ? { content: n.content.map(walk) } : {})
  });
  return walk(content as DocumentNode) as Json;
}
export function referenceSelection(b: Bundle, id: string) {
  return objectSelection(b, id);
}

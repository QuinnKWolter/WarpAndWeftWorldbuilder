import { Node, mergeAttributes } from '@tiptap/core';
import { z } from 'zod';
import { referenceSyntax } from '#lib/domain/manuscript';
const pattern =
  /^\{\{story:(entity|unit|event|relationship|thread):([0-9a-f-]{36})\|([^}\r\n]*)\}\}/i;
export const StoryReference = Node.create({
  name: 'storyReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      objectId: { default: '' },
      kind: { default: 'unit' },
      label: { default: 'Story object' }
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-story-reference]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-story-reference': node.attrs.objectId,
        class: 'story-reference',
        title: 'Planning placeholder · ' + node.attrs.kind,
        contenteditable: 'false'
      }),
      '⟦ ' + node.attrs.label + ' ⟧'
    ];
  },
  renderText() {
    return '';
  },
  markdownTokenizer: {
    name: 'storyReference',
    level: 'inline',
    start: (src) => src.indexOf('{{story:'),
    tokenize(src) {
      const match = pattern.exec(src);
      if (!match) return undefined;
      let label = match[3];
      try {
        label = decodeURIComponent(label);
      } catch {
        /* Keep readable source when malformed. */
      }
      if (!z.uuid().safeParse(match[2]).success) return undefined;
      return {
        type: 'storyReference',
        raw: match[0],
        kind: match[1].toLowerCase(),
        objectId: match[2],
        label: label.slice(0, 240)
      };
    }
  },
  parseMarkdown(token, helpers) {
    return helpers.createNode('storyReference', {
      objectId: token.objectId,
      kind: token.kind,
      label: token.label
    });
  },
  renderMarkdown(node) {
    return referenceSyntax(
      String(node.attrs?.kind),
      String(node.attrs?.objectId),
      String(node.attrs?.label)
    );
  }
});

import type { Workspace } from './workspace.svelte';
import { base } from '../domain/model';
export async function arrangeGraph(ws: Workspace) {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
  const graph = ws.graph;
  const elk = new ELK();
  const result = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '70',
      'elk.layered.spacing.nodeNodeBetweenLayers': '90'
    },
    children: graph.nodes.map((n) => ({ id: n.id, width: 264, height: 180 })),
    edges: graph.edges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] }))
  });
  const lens = `${ws.lens}:${ws.parentId ?? 'root'}`;
  ws.mutate((b) => {
    for (const node of result.children ?? []) {
      const existing = b.layouts.find((l) => l.lens === lens && l.objectId === node.id);
      if (existing) {
        existing.x = node.x ?? 0;
        existing.y = node.y ?? 0;
      } else b.layouts.push({ ...base(), lens, objectId: node.id, x: node.x ?? 0, y: node.y ?? 0 });
    }
  }, 'Graph arranged. Undo is available.');
}

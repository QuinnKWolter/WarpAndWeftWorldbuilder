import { test, expect, type Page } from '@playwright/test';
import type { Bundle } from '../../src/lib/domain/model';
async function demo(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.waitForURL('**/project/**');
  const id = page.url().split('/').at(-1)!;
  const read = async () => (await (await page.request.get('/api/projects/' + id)).json()) as Bundle;
  return { id, read };
}
async function command(page: Page, name: string) {
  await page.getByRole('button', { name: 'Open command palette' }).click();
  await page.getByRole('textbox', { name: 'Search commands and story' }).fill(name);
  await page.locator('.command-results button').first().click();
}
async function saved(page: Page) {
  await expect(page.getByRole('status')).toHaveText('All changes saved');
}
test('full-card color, previewed favorite icons, movable anchors, immediate deletion, unfollow and focus views', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const { read } = await demo(page);
  await command(page, 'Mara Venn');
  await page.getByLabel('Node color').fill('#946db6');
  await page.getByLabel('Name', { exact: true }).click();
  await page.getByLabel('Icon', { exact: true }).click();
  await page.getByLabel('Search icons').fill('castle');
  await expect(
    page.getByRole('button', { name: 'Castle', exact: true }).locator('svg')
  ).toBeVisible();
  await page.getByRole('button', { name: 'Favorite Castle', exact: true }).click();
  await expect(page.getByLabel('Search icons')).toBeVisible();
  await page.getByRole('button', { name: 'Favorites', exact: true }).click();
  await page.getByRole('button', { name: 'Castle', exact: true }).click();
  const node = page
    .locator('.svelte-flow__node')
    .filter({ has: page.locator('.story-node h3', { hasText: 'Mara Venn' }) });
  await expect(node.locator('.story-node')).toHaveCSS('--node-accent', '#946db6');
  const background = await node
    .locator('.story-node')
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(background).not.toBe('rgb(255, 254, 250)');
  await page.getByText('Connection anchors', { exact: true }).click();
  await page.getByLabel('Outgoing anchor side').selectOption('bottom');
  await page.getByLabel('Incoming anchor side').selectOption('top');
  await page.getByLabel('Anchors per direction').selectOption('3');
  await expect(node.locator('.svelte-flow__handle')).toHaveCount(6);
  await expect(node.locator('.svelte-flow__handle-bottom')).toHaveCount(3);
  await saved(page);
  await page.getByRole('button', { name: 'Fullscreen inspector', exact: true }).click();
  await expect(page.locator('.inspector-container')).toHaveCSS('position', 'fixed');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Fullscreen entities', exact: true }).click();
  await expect(page.locator('.shelf-container')).toHaveCSS('position', 'fixed');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Fullscreen graph', exact: true }).click();
  await expect(page.locator('.canvas-column')).toHaveCSS('position', 'fixed');
  await page.keyboard.press('Escape');
  await command(page, (await read()).threads[0].name);
  await page.getByRole('button', { name: 'Follow this thread', exact: true }).click();
  await page.getByRole('button', { name: 'Unfollow this thread', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Follow this thread', exact: true })).toBeVisible();
  await page.getByLabel('Graph lens').selectOption('world');
  const relation = (await read()).relationships[0];
  await page.locator('.semantic-edge-label').first().click();
  await page.keyboard.press('Delete');
  await expect(page.locator('.svelte-flow__edge[data-id="' + relation.id + '"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await command(page, 'Mara Venn');
  await node.locator('.story-node').click();
  await page.keyboard.press('Delete');
  await expect(node).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect(node).toBeVisible();
  await saved(page);
  await page.reload();
  await command(page, 'Mara Venn');
  await expect(page.getByLabel('Node color')).toHaveValue('#946db6');
  expect(errors).toEqual([]);
});
test('releasing a connection on empty canvas creates at that point and bulk descriptions use defaults', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const { read } = await demo(page);
  await page.getByRole('button', { name: 'Fullscreen graph' }).click();
  await page.getByRole('button', { name: 'Fit view', exact: true }).click();
  const node = page.locator('.svelte-flow__node').first();
  const handle = node.locator('.svelte-flow__handle.source').first();
  await expect(handle).toBeVisible();
  const start = (await handle.boundingBox())!;
  const canvas = (await page.locator('.graph-canvas').boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * 0.35, canvas.y + canvas.height * 0.78, {
    steps: 15
  });
  await page.mouse.up();
  await expect(page.getByRole('dialog')).toContainText('Grow a connection');
  await page.getByRole('button', { name: 'A world entity', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill('The releasing star');
  await page.getByRole('dialog').getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.locator('.story-node').filter({ hasText: 'The releasing star' })).toBeVisible();
  await saved(page);
  const b = await read();
  const created = b.entities.find((e) => e.name === 'The releasing star')!;
  expect(b.layouts.some((l) => l.objectId === created.id)).toBe(true);
  expect(b.links.some((l) => l.targetId === created.id || l.sourceId === created.id)).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Bulk add', exact: true }).click();
  await page.getByLabel('Use default facets for every row').check();
  await page
    .getByLabel('Entities', { exact: true })
    .fill('Iris | A traveler | A full description with history');
  await expect(page.getByRole('dialog')).toContainText('Name | summary | description');
  await page.getByRole('button', { name: 'Add 1 entity', exact: true }).click();
  await saved(page);
  expect((await read()).entities.find((e) => e.name === 'Iris')).toMatchObject({
    facets: ['character'],
    summary: 'A traveler',
    description: 'A full description with history'
  });
  expect(errors).toEqual([]);
});
test('manuscript Markdown, all reference kinds, outline population, notes, clean export and phone focus persist', async ({
  page
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const { read } = await demo(page);
  const b = await read();
  await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
  await page.getByRole('button', { name: 'Chapter', exact: true }).click();
  await page.getByLabel('Manuscript moment title').fill('The Written Chapter');
  await page.getByLabel('Manuscript moment title').blur();
  await page.getByRole('button', { name: 'Scene', exact: true }).click();
  await page.getByLabel('Manuscript moment title').fill('The Written Scene');
  await page.getByLabel('Manuscript moment title').blur();
  await expect(page.getByLabel('Text style')).toHaveValue('0');
  await page.getByLabel('Text style').selectOption('2');
  await expect(page.getByLabel('Text style')).toHaveValue('2');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await page.getByLabel('Markdown source').fill('# A voice\n\nA **beautiful** beginning.');
  await page.getByRole('button', { name: 'Rich text', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Scene prose' }).locator('strong')).toHaveText(
    'beautiful'
  );
  const ids = [
    b.entities[0].id,
    b.units.find((u) => u.type === 'scene')!.id,
    b.events[0].id,
    b.relationships[0].id,
    b.threads[0].id
  ];
  for (const id of ids) {
    await page.getByRole('button', { name: 'Insert placeholder', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const label =
      b.entities.find((e) => e.id === id)?.name ??
      b.units.find((u) => u.id === id)?.title ??
      b.events.find((e) => e.id === id)?.title ??
      b.relationships.find((r) => r.id === id)?.label ??
      b.threads.find((t) => t.id === id)?.name ??
      '';
    await dialog.getByLabel('Search story placeholders').fill(label);
    await dialog.locator('.reference-result').first().click();
  }
  await expect(page.locator('.story-reference')).toHaveCount(5);
  await page.getByRole('button', { name: 'Hide placeholders', exact: true }).click();
  await expect(page.locator('.story-reference').first()).toBeHidden();
  await page.getByRole('button', { name: 'Show placeholders', exact: true }).click();
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(page.getByLabel('Markdown source')).toHaveValue(/\{\{story:/);
  await page.getByRole('button', { name: 'Rich text', exact: true }).click();
  await expect(page.locator('.story-reference')).toHaveCount(5);
  await page.getByText('Notes & graph summary', { exact: true }).click();
  await page.getByLabel('Manuscript writing notes').fill('A private planning note.');
  await saved(page);
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export manuscript', exact: true }).click();
  const file = await dl;
  await file.saveAs(testInfo.outputPath('manuscript.md'));
  const text = await (
    await import('node:fs/promises')
  ).readFile(testInfo.outputPath('manuscript.md'), 'utf8');
  expect(text).toContain('**beautiful**');
  expect(text).not.toContain('{{story:');
  expect(text).not.toContain('A private planning note.');
  await page.locator('.manuscript-order button').filter({ hasText: 'The Written Chapter' }).click();
  await page.getByRole('button', { name: 'Populate from outline', exact: true }).click();
  await expect(page.locator('.story-reference')).toHaveCount(1);
  await page.getByRole('button', { name: 'Populate from outline', exact: true }).click();
  await expect(page.locator('.story-reference')).toHaveCount(1);
  await page.getByRole('button', { name: 'Expand placeholders (1)', exact: true }).click();
  await expect(page.locator('.story-reference')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Scene prose' })).toContainText(
    'The Written Scene'
  );
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect(page.locator('.story-reference')).toHaveCount(1);
  await page.getByRole('button', { name: 'Fullscreen manuscript', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('button', { name: 'Exit manuscript fullscreen', exact: true })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Close manuscript editor', exact: true }).click();
  await page.getByRole('button', { name: 'Open glossary' }).click();
  await page.getByLabel('Search glossary').fill('facet');
  await expect(page.getByRole('dialog')).toContainText('Default facets');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await saved(page);
  await page.reload();
  await page.getByRole('button', { name: 'Manuscript', exact: true }).click();
  await page.locator('.manuscript-order button').filter({ hasText: 'The Written Scene' }).click();
  await expect(page.locator('.story-reference')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

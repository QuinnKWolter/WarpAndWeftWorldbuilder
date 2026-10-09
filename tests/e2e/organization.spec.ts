import { test, expect, type Page, type Locator } from '@playwright/test';
import type { Bundle } from '../../src/lib/domain/model';

async function demo(page: Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/Warp & Weft Worldbuilder/);
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.waitForURL('**/project/**');
  const id = page.url().split('/').at(-1)!;
  const read = async () => (await (await page.request.get(`/api/projects/${id}`)).json()) as Bundle;
  return { id, read, original: await read() };
}
async function smooth(page: Page) {
  await page.getByLabel('Project menu').click();
  await page.getByRole('button', { name: 'Settings & shortcuts' }).click();
  await page.getByLabel('Animation style').selectOption('full');
  await page.getByRole('button', { name: 'Close dialog' }).click();
}
async function drag(page: Page, source: Locator, target: Locator) {
  // Start dragging before scrolling the destination into view. Both may not fit
  // simultaneously inside a compact pane.
  await source.evaluate(async (element) => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    // Scroll after enclosing slide/flip animations finish, so the drag starts from a visible box.
    const ancestors: Element[] = [];
    for (let node: Element | null = element; node; node = node.parentElement) ancestors.push(node);
    await Promise.all(
      ancestors
        .flatMap((node) => node.getAnimations())
        .map((animation) => animation.finished.catch(() => undefined))
    );
    element.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await source.hover();
  const start = (await source.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 12, start.y + start.height / 2, { steps: 4 });
  await target.evaluate((element) =>
    element.scrollIntoView({ block: 'center', behavior: 'instant' })
  );
  const end = (await target.boundingBox())!;
  await page.mouse.move(end.x + end.width / 2, end.y + end.height / 2, { steps: 12 });
  await page.mouse.move(end.x + end.width / 2 + 1, end.y + end.height / 2);
  await page.mouse.up();
}
async function folder(page: Page, name: string, inside?: string) {
  await page
    .getByRole('button', {
      name: inside ? `New folder inside ${inside}` : 'New entity folder',
      exact: true
    })
    .click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Folder name').fill(name);
  await dialog.getByLabel('Folder color').fill('#537fa0');
  await dialog.getByLabel('Folder icon').click();
  await dialog.getByRole('button', { name: 'Map Pin', exact: true }).click();
  await dialog.getByRole('button', { name: 'Create folder', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

test('folders and item drags are animated, editable, nested, undoable and portable', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { read, original } = await demo(page);
  await smooth(page);
  await folder(page, 'Northern Coast');
  const coast = page.getByRole('group', { name: 'Northern Coast folder', exact: true });
  await drag(
    page,
    page.locator('.collection-item .shelf-item').filter({ hasText: 'Mara Venn' }),
    coast
  );
  await drag(
    page,
    page.locator('.collection-item .shelf-item').filter({ hasText: 'Elian Rook' }),
    coast
  );
  const contents = coast.locator('..').locator(':scope > .folder-contents');
  await expect(contents).toContainText('Mara Venn');
  await expect(contents).toContainText('Elian Rook');
  await page.getByLabel('Sort entities').selectOption('name');
  await drag(
    page,
    contents.locator('.shelf-item').filter({ hasText: 'Mara Venn' }),
    contents.locator('.collection-item').filter({ hasText: 'Elian Rook' })
  );
  await expect(contents.locator('.shelf-item').first()).toContainText('Mara Venn');
  await expect(page.getByLabel('Sort entities')).toHaveValue('manual');
  // Measure visible intermediate folder heights, not merely declared CSS durations.
  const heights = page.evaluate(async () => {
    const row = [...document.querySelectorAll<HTMLElement>('.folder-row')].find(
      (e) => e.getAttribute('aria-label') === 'Northern Coast folder'
    )!;
    const content = row.parentElement!.querySelector<HTMLElement>('.folder-contents')!;
    const samples: number[] = [];
    const start = performance.now();
    while (performance.now() - start < 600) {
      samples.push(Math.round(content.getBoundingClientRect().height));
      await new Promise(requestAnimationFrame);
    }
    return samples;
  });
  await coast.locator('.folder-toggle').click();
  expect(new Set(await heights).size).toBeGreaterThan(3);
  await expect(coast.locator('.folder-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Edit folder Northern Coast', exact: true }).click();
  await page.getByLabel('Folder name').fill('Coastal cast');
  await page.getByLabel('Folder icon').click();
  await page.getByRole('button', { name: 'Moon', exact: true }).click();
  await page.getByRole('button', { name: 'Save folder', exact: true }).click();
  await expect(
    page.getByRole('group', { name: 'Coastal cast folder', exact: true }).locator('.folder-toggle')
  ).toHaveAttribute('aria-expanded', 'false');
  await expect
    .poll(async () =>
      (
        (await read()).project.settings.organization as { folders: { name: string }[] }
      ).folders.some((f) => f.name === 'Coastal cast')
    )
    .toBe(true);
  await page.reload();
  const cast = page.getByRole('group', { name: 'Coastal cast folder', exact: true });
  await expect(cast.locator('.folder-toggle')).toHaveAttribute('aria-expanded', 'false');
  await drag(page, cast, page.getByRole('group', { name: 'Places folder', exact: true }));
  await expect(
    page.getByRole('group', { name: 'Places folder', exact: true }).locator('..')
  ).toContainText('Coastal cast');
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect(cast.locator('..').locator('..')).toHaveClass('collection-tree');
  await cast.locator('.folder-toggle').click();
  await folder(page, 'Night watch', 'Coastal cast');
  await drag(
    page,
    page.locator('.collection-item .shelf-item').filter({ hasText: 'Mara Venn' }),
    page.getByRole('group', { name: 'Night watch folder', exact: true })
  );
  await expect(
    page.getByRole('group', { name: 'Night watch folder', exact: true }).locator('..')
  ).toContainText('Mara Venn');
  await page.getByRole('button', { name: 'Edit folder Coastal cast', exact: true }).click();
  await page.getByRole('button', { name: 'Remove folder, keep contents', exact: true }).click();
  await expect(cast).toHaveCount(0);
  await expect(page.getByRole('complementary', { name: 'Entities and outline' })).toContainText(
    'Mara Venn'
  );
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect(cast).toBeVisible();
  await expect
    .poll(async () =>
      (
        (await read()).project.settings.organization as { folders: { name: string }[] }
      ).folders.some((f) => f.name === 'Coastal cast')
    )
    .toBe(true);
  const bundle = await read();
  expect(bundle.units.map((u) => [u.id, u.storyTime])).toEqual(
    original.units.map((u) => [u.id, u.storyTime])
  );
  const cloned = await page.request.post('/api/projects', {
    data: { mode: 'import', title: 'A portable coastal cast', bundle }
  });
  expect(cloned.status()).toBe(201);
  const copy = (await cloned.json()) as Bundle;
  const copyFolders = (
    copy.project.settings.organization as {
      folders: { id: string; name: string; color: string; icon: string }[];
    }
  ).folders;
  expect(copyFolders.find((f) => f.name === 'Coastal cast')).toMatchObject({
    color: '#537fa0',
    icon: 'moon'
  });
  expect(copyFolders.find((f) => f.name === 'Night watch')).toBeTruthy();
  await page.goto(`/project/${copy.project.id}`);
  await expect(page.getByRole('complementary', { name: 'Entities and outline' })).toContainText(
    'Night watch'
  );
  expect(errors).toEqual([]);
});

test('double-click summaries, outline nesting, appearance and camera motion remain intuitive on desktop and phone', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { read, original } = await demo(page);
  await smooth(page);
  await page
    .locator('.collection-item .shelf-item')
    .filter({ hasText: 'The Quiet Harbour' })
    .dblclick();
  await page.getByRole('button', { name: 'Edit details', exact: true }).click();
  await expect(page.getByLabel('Icon', { exact: true })).toContainText('Map Pin');
  await page.getByLabel('Node color').fill('#537fa0');
  await page.getByLabel('Name', { exact: true }).click();
  await expect
    .poll(
      async () =>
        (await read()).entities.find((e) => e.name === 'The Quiet Harbour')?.metadata.presentation
    )
    .toMatchObject({ color: '#537fa0', icon: 'map' });
  await page.locator('.collection-item .shelf-item').filter({ hasText: 'Mara Venn' }).dblclick();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Mara Venn', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Connections');
  await page.getByRole('button', { name: 'Edit details', exact: true }).click();
  await page.getByLabel('Node color').fill('#946db6');
  await page.getByLabel('Icon', { exact: true }).click();
  await page.getByRole('button', { name: 'Moon', exact: true }).click();
  await page.getByLabel('Graph lens').selectOption('world');
  const mara = page.locator('.story-node').filter({ hasText: 'Mara Venn' });
  await expect(mara).toHaveCSS('--node-accent', '#946db6');
  expect(await mara.evaluate((e) => getComputedStyle(e).backgroundColor)).not.toBe(
    'rgb(255, 254, 250)'
  );
  await mara.dblclick();
  await expect(page.getByRole('dialog')).toContainText('Mara Venn');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByLabel('Graph lens').selectOption('narrative');
  await page.getByRole('button', { name: 'Zoom In', exact: true }).click();
  const movement = page.evaluate(async () => {
    const viewport = document.querySelector<HTMLElement>('.svelte-flow__viewport')!;
    const start = performance.now();
    const samples: string[] = [];
    while (performance.now() - start < 800) {
      samples.push(viewport.style.transform);
      await new Promise(requestAnimationFrame);
    }
    return samples;
  });
  await page.getByRole('button', { name: 'Fit view', exact: true }).click();
  expect(new Set(await movement).size).toBeGreaterThan(3);
  await page.getByRole('tab', { name: 'outline', exact: true }).click();
  const first = original.units.find((u) => u.title === 'A light across the water')!;
  const second = original.units.find((u) => u.title === 'The keeper’s invitation')!;
  const firstRow = page.getByRole('group', { name: first.title, exact: true });
  const secondRow = page.getByRole('group', { name: second.title, exact: true });
  await drag(page, firstRow.locator('.shelf-item'), secondRow);
  await expect
    .poll(async () => (await read()).units.find((u) => u.id === first.id)?.parentId)
    .toBe(second.id);
  expect((await read()).units.find((u) => u.id === first.id)?.storyTime).toBe(first.storyTime);
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect
    .poll(async () => (await read()).units.find((u) => u.id === first.id)?.parentId)
    .toBe(first.parentId);
  await firstRow.locator('.shelf-item').press('Alt+ArrowDown');
  await expect
    .poll(
      async () =>
        (await read()).units
          .filter((u) => u.parentId === first.parentId)
          .sort((a, b) => a.rank - b.rank)[1]?.id
    )
    .toBe(first.id);
  await firstRow.locator('.shelf-item').dblclick();
  await expect(page.getByRole('dialog')).toContainText(first.title);
  await page.getByRole('button', { name: 'Write moment', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Scene prose' })).toBeVisible();
  await page.getByRole('button', { name: 'Close writing workspace' }).click();
  const act = original.units.find((u) => u.id === first.parentId)!;
  await page.getByRole('button', { name: `Collapse ${act.title}`, exact: true }).click();
  await expect(firstRow).toHaveCount(0);
  await page.getByLabel('Search entities and outline').fill(first.title);
  await expect(firstRow).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Toggle entities panel' }).click();
  await expect(page.getByRole('button', { name: 'Close entities panel' })).toBeVisible();
  await page.getByRole('tab', { name: 'Entities', exact: true }).click();
  await page.getByLabel('Search entities and outline').fill('Mara');
  await page.getByRole('button', { name: 'Summary of Mara Venn', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Mara Venn');
  await page.getByRole('button', { name: 'Edit details', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Story inspector' })).toBeVisible();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Mara Venn');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

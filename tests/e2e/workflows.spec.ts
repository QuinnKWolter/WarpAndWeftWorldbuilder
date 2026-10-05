import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function command(page: Page, name: string) {
  await page.getByRole('button', { name: 'Open command palette' }).click();
  await page.getByRole('textbox', { name: 'Search commands and story' }).fill(name);
  await page.locator('.command-results button').first().click();
}
async function createEntity(page: Page, name: string, facets = 'character') {
  await command(page, 'Create entity');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill(name);
  await dialog.getByLabel(/Facets/).fill(facets);
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
async function createScene(page: Page, name: string, time: string) {
  await page.getByRole('button', { name: 'Add moment', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill(name);
  await dialog.getByLabel('Story point', { exact: true }).fill(time);
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
async function saved(page: Page) {
  await expect(page.getByRole('status')).toHaveText('All changes saved');
}

test('a writer creates a temporal story, writes, reorders, and carries it through export/import', async ({
  page
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Start a story' }).click();
  await page.getByLabel('Story title').fill('An ordinary miracle');
  await page.getByRole('button', { name: 'Create story', exact: true }).click();
  await page.waitForURL('**/project/**');
  await createEntity(page, 'Alice');
  await createScene(page, 'Beginning', '1');
  await page.getByLabel('Entity to add to scene').selectOption({ label: 'Alice' });
  await page.getByRole('button', { name: 'Add participant', exact: true }).click();
  await expect(page.locator('.participant-list')).toContainText('Alice');
  await createEntity(page, 'Bob');
  await createEntity(page, 'Red Key', 'item');
  await command(page, 'Create relationship');
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Relationship label').fill('Alice & Bob');
  await dialog.getByLabel('From', { exact: true }).selectOption({ label: 'Alice' });
  await dialog.getByLabel('To', { exact: true }).selectOption({ label: 'Bob' });
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('button', { name: 'Add relationship state', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('State', { exact: true }).fill('Strangers');
  await dialog.getByLabel('Story point', { exact: true }).fill('1');
  await dialog.getByLabel('Causing scene').selectOption({ label: 'Beginning' });
  await dialog.getByRole('button', { name: 'Record change', exact: true }).click();
  await createScene(page, 'Ending', '9');
  await page.getByLabel('Graph lens').selectOption('relationships');
  await page.getByRole('button', { name: 'Inspect connection: Strangers', exact: true }).click();
  await expect(page.locator('.current-state')).toContainText('Strangers');
  await page.getByRole('button', { name: 'Add relationship state', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('State', { exact: true }).fill('Enemies');
  await dialog.getByLabel('Story point', { exact: true }).fill('9');
  await dialog.getByLabel('Causing scene').selectOption({ label: 'Ending' });
  await dialog.getByRole('button', { name: 'Record change', exact: true }).click();
  await page.getByLabel('Current story point').fill('1');
  await expect(page.locator('.current-state')).toContainText('Strangers');
  await page.getByLabel('Current story point').fill('9');
  await expect(page.locator('.current-state')).toContainText('Enemies');
  await page.getByRole('button', { name: 'At this moment', exact: true }).click();
  await expect(page.locator('.current-state')).toContainText('Strangers → Enemies');
  await page.getByLabel('Graph lens').selectOption('narrative');
  await page.getByRole('button', { name: 'Insert between scenes' }).first().click();
  await page.getByRole('button', { name: 'Insert a new scene', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('Betrayal');
  await dialog.getByLabel('Story point', { exact: true }).fill('4');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.locator('.story-node')).toHaveCount(3);
  await page.getByRole('button', { name: 'Move scene later' }).click();
  await expect(page.getByLabel('Story point', { exact: true })).toHaveValue('4');
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await command(page, 'Create thread');
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('Mystery');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await command(page, 'Betrayal');
  await page.getByLabel('Mystery', { exact: true }).check();
  await page.getByRole('button', { name: 'Create nested moment', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('A whisper');
  await dialog.getByLabel('Kind', { exact: true }).selectOption('beat');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await command(page, 'Betrayal');
  await page.getByRole('button', { name: 'Add event', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact: true }).fill('Alice takes the key');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await command(page, 'Betrayal');
  await page.getByRole('button', { name: 'Add world change', exact: true }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Who changes?').selectOption({ label: 'Alice' });
  await dialog.getByLabel('Target object (optional)').selectOption({ label: 'Red Key' });
  await dialog.getByLabel('Causing event').selectOption({ label: 'Alice takes the key' });
  await dialog.getByRole('button', { name: 'Record change', exact: true }).click();
  await expect(page.locator('.diff-row')).toContainText('true');
  await page.getByRole('button', { name: 'Write this moment', exact: true }).click();
  const prose = page.getByRole('textbox', { name: 'Scene prose', exact: true });
  await prose.fill('Alice turned the red key. Somewhere, a door remembered her.');
  // A graph undo must not roll back prose written after that transaction.
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect(prose).toContainText('a door remembered her');
  await page.getByRole('button', { name: 'Redo story change' }).click();
  await saved(page);
  await page.reload();
  await command(page, 'Betrayal');
  await page.getByRole('button', { name: 'Write this moment', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Scene prose', exact: true })).toContainText(
    'a door remembered her'
  );
  await page.getByLabel('Graph lens').selectOption('threads');
  await expect(page.getByRole('button', { name: 'Mystery', exact: true })).toBeVisible();
  await page.locator('.workspace-status button').click();
  await expect(page.getByRole('dialog')).toContainText('continuity check');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await saved(page);
  await page.getByLabel('Project menu').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export project JSON' }).click();
  const download = await downloadPromise;
  const exportPath = testInfo.outputPath('story.storygraph.json');
  await download.saveAs(exportPath);
  const original = JSON.parse(await readFile(exportPath, 'utf8'));
  expect(original.documents.some((d: { text: string }) => d.text.includes('door remembered'))).toBe(
    true
  );
  await page.getByRole('button', { name: 'Back to stories' }).click();
  await page.waitForURL('/');
  await page.getByLabel('Options for An ordinary miracle', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Delete story', exact: true }).click();
  await expect(page.getByRole('link').filter({ hasText: 'An ordinary miracle' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Import a story' }).click();
  await page.getByLabel('Import Storygraph file').setInputFiles(exportPath);
  await page.getByLabel('Story title').fill('An ordinary miracle, returned');
  await page.getByRole('button', { name: 'Import story', exact: true }).click();
  await page.waitForURL('**/project/**');
  await expect(page.locator('.project-title')).toContainText('returned');
  await command(page, 'Betrayal');
  await page.getByRole('button', { name: 'Write this moment', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Scene prose', exact: true })).toContainText(
    'door remembered'
  );
  expect(errors).toEqual([]);
});

test('the demo exposes a real warning and keyboard search, with usable phone drawers', async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.waitForURL('**/project/**');
  await expect(page.getByRole('complementary', { name: 'Story shelf' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle story shelf' }).click();
  await expect(page.getByRole('complementary', { name: 'Story shelf' })).toBeVisible();
  await page.getByRole('button', { name: 'Close story shelf' }).click();
  await page.getByRole('button', { name: 'Toggle inspector' }).click();
  await expect(page.getByRole('complementary', { name: 'Story inspector' })).toBeVisible();
  await page.getByRole('button', { name: 'Close inspector' }).click();
  await page.keyboard.press('Control+k');
  await page.getByRole('textbox', { name: 'Search commands and story' }).fill('Mara');
  await page.locator('.command-results button').first().click();
  await page.getByRole('button', { name: 'Toggle inspector' }).click();
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Mara Venn');
  await page.getByRole('button', { name: 'Close inspector' }).click();
  await page.locator('.workspace-status button').click();
  await expect(page.getByRole('dialog')).toContainText('Mara Venn needs possession');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});

test('failed saves preserve writing and show retry; stale windows cannot overwrite saved stories', async ({
  page,
  context
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.waitForURL('**/project/**');
  const url = page.url();
  const other = await context.newPage();
  await other.goto(url);
  await expect(other.getByRole('button', { name: 'Add moment' })).toBeVisible();
  await page.getByLabel('Title', { exact: true }).fill('Changed in the first window');
  await page.getByLabel('Title', { exact: true }).blur();
  await saved(page);
  await other.getByLabel('Title', { exact: true }).fill('Conflicting change');
  await other.getByLabel('Title', { exact: true }).blur();
  await expect(other.getByRole('alert')).toContainText('another window');
  await expect(other.getByRole('button', { name: 'Export pending work' })).toBeVisible();
  await page.route('**/api/projects/*', async (route) => {
    if (route.request().method() === 'PUT') await route.abort();
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Write this moment', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Scene prose' })
    .fill('A sentence worth keeping through a failed save.');
  await expect(page.getByRole('alert')).toBeVisible();
  const pending = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((key) => key.startsWith('storygraph:draft:'))
      .map((key) => localStorage.getItem(key))
      .join('')
  );
  expect(pending).toContain('worth keeping');
  await page.unroute('**/api/projects/*');
  await page.getByRole('button', { name: 'Retry save' }).click();
  await saved(page);
  await other.close();
});

test('semantic links, event steps and placeholder merges remain editable and undoable', async ({
  page
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.waitForURL('**/project/**');
  await command(page, 'A door without a room');
  await page.getByRole('button', { name: 'Inspect connection: causes', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Semantic link', { exact: true }).selectOption('reveals');
  await dialog.getByRole('button', { name: 'Save connection', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect connection: reveals', exact: true }).click();
  await page.getByRole('button', { name: 'Delete connection', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Inspect connection: reveals', exact: true })
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect(
    page.getByRole('button', { name: 'Inspect connection: reveals', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Include event steps', exact: true }).click();
  const eventPoint = page
    .getByRole('group', { name: 'Timeline points' })
    .getByRole('button', { name: /Event.*The protocol is found/ });
  await eventPoint.click();
  await expect(eventPoint).toHaveClass(/active/);
  await eventPoint.press('ArrowRight');
  await expect(page.getByRole('spinbutton', { name: 'Current story point' })).toHaveValue('3');
  await eventPoint.press('ArrowRight');
  await expect(page.getByRole('spinbutton', { name: 'Current story point' })).toHaveValue('4');
  await command(page, 'Someone must pay the price');
  await page.getByRole('button', { name: 'Write this moment', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Scene prose', exact: true })
    .fill('A price we remember.');
  await page.getByRole('button', { name: 'Close writing workspace' }).click();
  await page.getByRole('button', { name: 'Resolve this possibility' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Resolve as').selectOption('existing');
  await dialog.getByLabel('Merge into').selectOption({ label: 'A light across the water' });
  await dialog.getByRole('button', { name: 'Resolve idea' }).click();
  await expect(page.getByLabel('Title', { exact: true })).toHaveValue('A light across the water');
  await page.getByRole('button', { name: 'Write this moment', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Scene prose' })).toContainText(
    'A price we remember.'
  );
  await page.getByRole('button', { name: 'Undo story change' }).click();
  await expect(page.getByRole('textbox', { name: 'Scene prose' })).not.toContainText(
    'A price we remember.'
  );
  await command(page, 'Someone must pay the price');
  await page.getByRole('button', { name: 'Write this moment', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Scene prose' })).toContainText(
    'A price we remember.'
  );
  await saved(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Leave focus writing' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Story inspector' })).toHaveCount(0);
});

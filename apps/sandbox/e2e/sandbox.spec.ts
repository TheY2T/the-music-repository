import { expect, test } from '@playwright/test';

test('the index lists the component catalogue', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Component sandbox', level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Component catalogue' })).toBeVisible();
  // Both grouping axes are represented: per-package sections + a by-domain index.
  await expect(page.getByRole('heading', { name: '@TheY2T/tmr-ui' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'By domain' })).toBeVisible();
});

test('search filters the sidebar', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Search components' });
  await search.fill('metronome');
  const nav = page.getByRole('navigation', { name: 'Component catalogue' });
  await expect(nav.getByRole('link', { name: 'Metronome' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Button' })).toHaveCount(0);
});

test('a presentational specimen renders with live prop controls', async ({ page }) => {
  await page.goto('/c/ui-button');
  const preview = page.getByRole('heading', { name: 'Preview' }).locator('..');
  await expect(preview.getByRole('button', { name: 'Play scale' })).toBeVisible();
  // Editing the label control updates the rendered button.
  const label = page.getByLabel('Label');
  await label.fill('Custom label');
  await expect(preview.getByRole('button', { name: 'Custom label' })).toBeVisible();
});

test('theme switching flips the aesthetic + dark class on <html>', async ({ page }) => {
  await page.goto('/c/ui-button');
  await page.getByRole('button', { name: 'Appearance' }).click();
  await page.getByRole('button', { name: /Heritage/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'heritage');
  await page.getByRole('button', { name: /Dark/ }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('an interactive tool renders (Circle of Fifths) with its theory inspector', async ({
  page,
}) => {
  await page.goto('/c/mk-circle-of-fifths');
  await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Engine inspector' })).toBeVisible();
  // The theory inspector's scales table renders from the real data source.
  await expect(page.getByRole('tab', { name: /Scales/ })).toBeVisible();
});

test('a data-backed component renders via the mock port with no live API', async ({ page }) => {
  await page.goto('/c/mk-catalogue-browser');
  await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible();
  // The mock port resolves immediately, so the boundary error is never shown.
  await expect(page.getByText('threw while rendering')).toHaveCount(0);
});

test('sidebar navigation is a soft swap that keeps the selection in view', async ({ page }) => {
  await page.goto('/c/cu-classrooms');
  // A flag on window survives a view-transition swap but not a full reload.
  await page.evaluate(() => {
    (window as unknown as { __persist?: boolean }).__persist = true;
  });
  const nav = page.getByRole('navigation', { name: 'Component catalogue' });
  await expect(nav.getByRole('link', { name: 'ClassroomsManager' })).toHaveAttribute(
    'aria-current',
    'page',
  );

  // Click a different item far down the list.
  await nav.getByRole('link', { name: 'SpacesBuilder' }).click();
  await expect(page).toHaveURL('/c/cu-spaces-builder');

  // No full page reload (soft navigation), the highlight follows the URL, and it stays on screen.
  expect(await page.evaluate(() => (window as unknown as { __persist?: boolean }).__persist)).toBe(
    true,
  );
  const active = nav.locator('[aria-current="page"]');
  await expect(active).toHaveText('SpacesBuilder');
  await expect(active).toBeInViewport();
});

test('unknown specimen ids redirect to the index', async ({ page }) => {
  await page.goto('/c/does-not-exist');
  await expect(page).toHaveURL('/');
});

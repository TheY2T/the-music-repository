import { expect, test } from './fixtures';
// @ts-expect-error — .mjs sibling without types.
import { authFile } from './mocks/data.mjs';

// The `feedback.form` flag defaults on, so the page + footer link are present in mock mode. Submission
// requires auth, so anonymous visitors get the sign-in prompt; a signed-in learner can submit (the POST
// is mocked inline here — no shared handler needed).
test.describe('Feedback', () => {
  test('/feedback renders its heading', async ({ page }) => {
    const res = await page.goto('/feedback');
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('h1')).toHaveText('Share your feedback');
  });

  test('footer exposes a feedback link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer a[href$="/feedback"]').first()).toBeVisible();
  });

  test('anonymous visitors are prompted to sign in', async ({ page }) => {
    await page.goto('/feedback');
    await expect(page.getByText('Please sign in to send feedback.')).toBeVisible();
  });

  test('a signed-in learner can submit feedback', async ({ browser }) => {
    const context = await browser.newContext({ storageState: authFile('learner') });
    const page = await context.newPage();
    await context.route('**/api/auth/get-session', (route) =>
      route.fulfill({
        json: {
          user: { id: 'u-learner', email: 'learner@local.dev', name: 'Learner', role: 'learner' },
        },
      }),
    );
    await context.route('**/feedback', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: {
            id: 'f1',
            type: 'idea',
            message: 'Add a metronome',
            status: 'new',
            userId: 'u-learner',
            isPublic: false,
            upvoteCount: 0,
            createdAt: '2026-07-19T00:00:00.000Z',
            updatedAt: '2026-07-19T00:00:00.000Z',
          },
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/feedback');
    await page.getByPlaceholder("Tell us what's on your mind…").fill('Add a metronome');
    await page.getByRole('button', { name: 'Send feedback' }).click();
    await expect(page.getByText('Thanks — your feedback has been sent.')).toBeVisible();
    await context.close();
  });
});

import { expect, test } from './fixtures';
// @ts-expect-error — .mjs sibling without types.
import { authFile } from './mocks/data.mjs';

// Drill engine objective session (ADR — drills expansion). The old /drills was a self-grade flashcard;
// the engine renders a generated prompt, checks the answer objectively (correct/wrong + reveal), fires
// Tier-1 rewards, and records an attempt to the backend. DrillSession is a Pixi/hook island (duplicate-
// React under getViteConfig), so its coverage lives here. Flags fall back to defaults (drill-engine on).
test.describe('drill engine session', () => {
  test('redirects an anonymous visitor to sign-in', async ({ page }) => {
    await page.goto('/drills/staff-notes');
    await expect(page).toHaveURL(/\/signin\?redirect=\/drills/);
  });

  test('a signed-in learner answers a note-reading drill and gets objective feedback', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: authFile('learner') });
    const page = await context.newPage();
    await context.route('**/api/auth/get-session', async (route) => {
      await route.fulfill({
        json: {
          user: { id: 'u-learner', email: 'learner@local.dev', name: 'Learner', role: 'learner' },
        },
      });
    });

    // No stored SM-2 state → the session draws fresh cards from the generator.
    await context.route('**/me/reviews/staff-notes', async (route) => {
      await route.fulfill({ json: { cards: [] } });
    });

    // Capture the objective attempt the session records after an answer.
    let recorded: Record<string, unknown> | null = null;
    await context.route('**/me/drills/attempts', async (route) => {
      recorded = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        json: {
          state: {
            card: '',
            easeFactor: 2.5,
            intervalDays: 1,
            repetitions: 1,
            dueAt: new Date().toISOString(),
          },
          quality: 4,
          isPersonalBest: false,
        },
      });
    });

    await page.goto('/drills/staff-notes');

    // The objective prompt: a treble staff + a locking option grid (letter+octave note names).
    await expect(page.getByText('Choose the answer')).toBeVisible();
    const option = page.getByRole('button', { name: /^[A-G]\d$/ }).first();
    await option.click();

    // Objective reveal — one of the two outcomes appears, plus a Next button (never a self-grade).
    await expect(page.getByText(/^(Correct!|Not quite)$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();

    // The attempt was recorded to the backend with the objective result.
    expect(recorded).not.toBeNull();
    expect(recorded).toMatchObject({ deck: 'staff-notes', modality: 'multiple-choice' });
    expect(typeof (recorded as { accuracy: number }).accuracy).toBe('number');
  });
});

import type { Page } from '@playwright/test';
// @ts-expect-error — .mjs sibling without types; the shapes are plain data.
import { MOCK_CATALOGUE, selectedServices, sessionResponseFromCookieHeader } from './data.mjs';

// Browser-side counterpart to the MSW SSR layer: intercepts fetches made by hydrated React islands
// (client-side). Same service selection + data as the SSR layer, so both tiers stay consistent.
export async function installBrowserMocks(page: Page): Promise<void> {
  const services: string[] = selectedServices();

  if (services.includes('auth')) {
    await page.route('**/api/auth/get-session', async (route) => {
      const cookie = route.request().headers().cookie ?? '';
      await route.fulfill({ json: sessionResponseFromCookieHeader(cookie) });
    });
  }

  if (services.includes('catalogue')) {
    await page.route('**/content*', async (route) => {
      await route.fulfill({ json: MOCK_CATALOGUE });
    });
  }
}

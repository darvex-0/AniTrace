import { test, expect } from '@playwright/test';
import { DiscoverPage } from './pages/DiscoverPage';

test.describe('AniTrace - Discover & Search E2E Flow', () => {
  let discoverPage: DiscoverPage;

  test.beforeEach(async ({ page }) => {
    discoverPage = new DiscoverPage(page);
    await discoverPage.goto();
  });

  test('TC-DISC-E2E-001: Discover page loads with search input and header', async () => {
    await expect(discoverPage.heading).toBeVisible();
    await expect(discoverPage.searchInput).toBeVisible();
  });

  test('TC-DISC-E2E-002: Live search returns and displays anime cards from TMDB', async () => {
    await discoverPage.search('Naruto');
    await discoverPage.verifyResultsContain('Naruto');
  });
});

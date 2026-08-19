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

  test('TC-DISC-E2E-002: Live search returns and displays anime cards from TMDB', async ({ page }) => {
    // Intercept TMDB search endpoint to return deterministic mock data in CI
    await page.route('**/3/search/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            {
              id: 46260,
              name: 'Naruto',
              media_type: 'tv',
              poster_path: '/vauC629svR62mfaJ1nUv91CmTyY.jpg',
              overview: 'Naruto Uzumaki, a mischievous adolescent ninja...',
              vote_average: 8.4,
              genre_ids: [16, 10759],
            },
          ],
        }),
      });
    });

    await discoverPage.search('Naruto');
    await discoverPage.verifyResultsContain('Naruto');
  });
});

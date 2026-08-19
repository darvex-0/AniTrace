import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Watchlist & Progress Page (/)
 */
export class WatchlistPage {
  readonly page: Page;
  readonly addMediaButton: Locator;
  readonly searchInput: Locator;
  readonly progressDialog: Locator;
  readonly episodeInput: Locator;
  readonly seasonInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addMediaButton = page.getByRole('button', { name: /Add Media|Add to Watchlist/i });
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.progressDialog = page.getByRole('dialog');
    this.episodeInput = page.locator('input[type="number"]').first();
    this.seasonInput = page.locator('input[type="number"]').nth(1);
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyFilterTabsVisible() {
    await expect(this.page.getByRole('tab', { name: /All|Watching|Completed/i }).first()).toBeVisible();
  }
}

import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Discover Page (/discover)
 */
export class DiscoverPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder*="Search anime"]');
    this.heading = page.getByRole('heading', { name: /Find your next/i });
  }

  async goto() {
    await this.page.goto('/discover');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    // Debounce wait for 500ms
    await this.page.waitForTimeout(600);
  }

  async verifyResultsContain(text: string) {
    const resultElement = this.page.getByText(text, { exact: false }).first();
    await expect(resultElement).toBeVisible({ timeout: 15000 });
  }
}

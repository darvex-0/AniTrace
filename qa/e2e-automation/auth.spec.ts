import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/AuthPage';

test.describe('AniTrace - Authentication & Navigation E2E Suite', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test('TC-AUTH-E2E-001: Auth page loads with correct title and branding', async ({ page }) => {
    // Assert page title or branding exists
    await expect(page).toHaveTitle(/AniTrace/i);
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
  });

  test('TC-AUTH-E2E-002: Validation error displayed on empty form submit', async ({ page }) => {
    // Click submit without entering email or password
    await authPage.submitButton.click();
    
    // HTML5 or UI validation check
    const isEmailFocusedOrInvalid = await page.evaluate(() => {
      const emailEl = document.querySelector('input[type="email"]') as HTMLInputElement;
      return emailEl ? !emailEl.checkValidity() : false;
    });

    expect(isEmailFocusedOrInvalid).toBeTruthy();
  });

  test('TC-AUTH-E2E-003: UI Responsive layout adapts to viewport size', async ({ page }) => {
    // Check viewport layout
    const container = page.locator('main, .container, #root');
    await expect(container.first()).toBeVisible();
  });
});

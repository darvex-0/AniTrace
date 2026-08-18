import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model (POM) for the Authentication Page (/auth)
 * Encapsulates UI selectors and user interactions.
 */
export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly signUpTab: Locator;
  readonly signInTab: Locator;
  readonly guestButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.signUpTab = page.getByRole('tab', { name: /sign up|register/i });
    this.signInTab = page.getByRole('tab', { name: /sign in|login/i });
    this.guestButton = page.getByRole('button', { name: /guest|continue as guest/i });
  }

  async goto() {
    await this.page.goto('/auth');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async switchToSignUp() {
    if (await this.signUpTab.isVisible()) {
      await this.signUpTab.click();
    }
  }

  async continueAsGuest() {
    if (await this.guestButton.isVisible()) {
      await this.guestButton.click();
    }
  }
}

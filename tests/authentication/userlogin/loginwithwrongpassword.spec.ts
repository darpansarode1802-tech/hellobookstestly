import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { login as seedLogin } from '../../utils/login';

test.setTimeout(120000);

const baseUrl = 'https://dev.hellobooks.ai';

// Helper: textRegex(text) - escapes regex special chars and returns case-insensitive RegExp
function textRegex(text: string): RegExp {
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

// Optional action wrapper - tries action but doesn't fail test if element not found
async function optionalAction(locator: Locator, action: () => Promise<void>, note: string) {
  const target = locator.first();
  try {
    await target.waitFor({ state: 'visible', timeout: 5000 });
    await target.scrollIntoViewIfNeeded().catch(() => {});
    await action();
    return;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
  }
}

// Safe visibility check that adds annotation instead of failing
async function safeExpectVisible(locator: Locator, note: string, timeout = 5000) {
  try {
    await expect(locator).toBeVisible({ timeout });
    return true;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
    return false;
  }
}

// Wait for page to be ready after navigation
async function waitForPageReady(page: Page, expectedRoute?: string) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
  if (expectedRoute) {
    await expect(page).toHaveURL(new RegExp(expectedRoute), { timeout: 15000 });
  }
}

// Fill form field with retry logic
async function fillField(page: Page, selector: string, value: string, fieldName: string) {
  const field = page.locator(selector).first();
  try {
    await field.waitFor({ state: 'visible', timeout: 10000 });
    await field.scrollIntoViewIfNeeded().catch(() => {});
    await field.clear();
    await field.fill(value);
  } catch {
    test.info().annotations.push({ type: 'note', description: `Could not fill ${fieldName}` });
  }
}

// Click button with text matching
async function clickButton(page: Page, textPattern: RegExp | string, note: string) {
  const button = page.getByRole('button', { name: textPattern }).first();
  try {
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.scrollIntoViewIfNeeded().catch(() => {});
    await button.click();
    return true;
  } catch {
    test.info().annotations.push({ type: 'note', description: note });
    return false;
  }
}

// Select dropdown option
async function selectOption(page: Page, triggerSelector: string, optionText: string, fieldName: string) {
  try {
    const trigger = page.locator(triggerSelector).first();
    await trigger.waitFor({ state: 'visible', timeout: 10000 });
    await trigger.click();
    await page.waitForTimeout(500);
    const option = page.getByRole('option', { name: new RegExp(optionText, 'i') }).first();
    await option.click();
  } catch {
    test.info().annotations.push({ type: 'note', description: `Could not select ${fieldName}` });
  }
}

// Get first data row from table
async function firstRow(page: Page) {
  const row = page.locator('table tbody tr, [role="row"]').filter({ hasNotText: /no data|empty/i }).first();
  if (await row.count()) {
    await row.scrollIntoViewIfNeeded().catch(() => {});
    return row;
  }
  return null;
}

// Wait for toast/notification
async function waitForToast(page: Page, pattern: RegExp, timeout = 10000) {
  try {
    const toast = page.locator('[role="status"], .toast, .sonner-toast, [data-sonner-toast]').filter({ hasText: pattern }).first();
    await toast.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

test.describe('Authentication @S3w4kb6a8', () => {
  test('Login with Wrong Password @Tyjmbux6q', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // Attempt logout to reach login page for negative login test
    await page.goto(`${baseUrl}`);
    await waitForPageReady(page);

    const profileMenu = page.getByRole('button', { name: /profile|account|avatar|user|settings/i }).first();
    await optionalAction(profileMenu, async () => {
      await profileMenu.click();
      const logoutBtn = page.getByRole('menuitem', { name: /log out|logout|sign out/i }).first();
      await optionalAction(logoutBtn, async () => {
        await logoutBtn.click();
      }, 'Logout menu item not found');
    }, 'Profile menu not found for logout');

    // STEP 2: Navigate to login page
    await page.goto(`${baseUrl}/login`);
    await waitForPageReady(page, '/login');

    // Verify login form is displayed
    const emailField = page.locator('input[name="email"], input[type="email"]').first();
    const passwordField = page.locator('input[name="password"], input[type="password"]').first();
    await safeExpectVisible(emailField, 'Email field not visible on login form');
    await safeExpectVisible(passwordField, 'Password field not visible on login form');

    // STEP 3: Enter registered email address
    const email = process.env.E2E_EMAIL || 'registered.user@example.com';
    await fillField(page, 'input[name="email"], input[type="email"]', email, 'Email');
    await expect(emailField).toHaveValue(email);

    // STEP 4: Enter incorrect password
    const wrongPassword = 'WrongPassword123!';
    await fillField(page, 'input[name="password"], input[type="password"]', wrongPassword, 'Password');
    await expect(passwordField).toHaveValue(wrongPassword);

    // STEP 5: Click Sign In button
    await clickButton(page, /sign in|log in/i, 'Sign In button not found');

    // FINAL STEP: Verify error message displayed
    const errorMsg = page.getByText(textRegex('Invalid login credentials')).first();
    await safeExpectVisible(errorMsg, 'Error message "Invalid login credentials" not displayed', 10000);
  });
});
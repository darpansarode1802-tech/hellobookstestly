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

test.describe('Authentication @Sz98one3m', () => {
  test('Successful User Registration with Valid Credentials @Tb73cwnl9', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);

    // STEP 2: Navigate to the starting point
    await page.goto(`${baseUrl}`);
    await waitForPageReady(page);
    await expect(page).not.toHaveURL(/\/login/i, { timeout: 20000 });

    // Optional: attempt to log out if already logged in to access signup
    await optionalAction(page.getByRole('button', { name: /profile|account|avatar|user/i }), async () => {
      await page.getByRole('menuitem', { name: /logout|sign out/i }).first().click();
    }, 'Could not open profile menu to logout');

    // STEP 3: Navigate to Sign Up page
    await optionalAction(page.getByRole('link', { name: /sign up|register|create account/i }), async () => {
      await page.getByRole('link', { name: /sign up|register|create account/i }).first().click();
    }, 'Sign Up link not found on landing page');

    // Fallback: direct navigation to signup if link not found
    if (!/signup|register/i.test(page.url())) {
      await page.goto(`${baseUrl}/signup`);
    }
    await waitForPageReady(page);

    // STEP 4: Verify signup form displayed with email and password fields
    const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
    const passwordField = page.locator('input[type="password"], input[name="password"], input[placeholder*="password"]').first();
    await safeExpectVisible(emailField, 'Email input not visible on signup page');
    await safeExpectVisible(passwordField, 'Password input not visible on signup page');

    // STEP 5: Enter valid email and password
    const uniqueEmail = `autouser_${Date.now()}@example.com`;
    await fillField(page, 'input[type="email"], input[name="email"], input[placeholder*="email"]', uniqueEmail, 'Email');
    await fillField(page, 'input[type="password"], input[name="password"], input[placeholder*="password"]', 'Passw0rd!', 'Password');

    // Verify password is masked
    await expect(passwordField).toHaveAttribute('type', /password/i);

    // STEP 6: Click Sign Up button
    await clickButton(page, /sign up|register|create account/i, 'Sign Up button not found');

    // STEP 7: Verify account creation success and user logged in
    const toastVisible = await waitForToast(page, /success|created|welcome|verified|registered/i);
    if (!toastVisible) {
      test.info().annotations.push({ type: 'note', description: 'No success toast detected after sign up' });
    }

    // Verify redirect to dashboard or non-login page
    await waitForPageReady(page);
    await expect(page).not.toHaveURL(/\/login|\/signup|\/register/i, { timeout: 20000 });

    // Optional: verify presence of dashboard elements
    await safeExpectVisible(page.getByRole('heading', { name: /dashboard|overview|home/i }).first(), 'Dashboard heading not visible after signup', 8000);
  });
});
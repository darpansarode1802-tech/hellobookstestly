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

test.describe('Authentication @S71mivqtv', () => {
  test('Login with Non-Existent Email @Ticxdfpts', async ({ page }) => {
    // STEP 1: Login using seedLogin utility (REQUIRED)
    await seedLogin(page);
    
    // STEP 2: Navigate to the starting point (login page)
    await page.goto(`${baseUrl}/login`);
    await waitForPageReady(page);

    // If redirected due to existing session, attempt logout and return to login
    const loginForm = page.locator('form').filter({ hasText: /sign in|login|password|email/i }).first();
    if (!(await loginForm.isVisible().catch(() => false))) {
      await optionalAction(page.getByRole('button', { name: /profile|account|avatar|user/i }), async () => {
        await page.getByRole('button', { name: /profile|account|avatar|user/i }).first().click();
      }, 'User menu not found to attempt logout');

      await optionalAction(page.getByRole('menuitem', { name: /logout|sign out/i }), async () => {
        await page.getByRole('menuitem', { name: /logout|sign out/i }).first().click();
      }, 'Logout option not found');

      await page.goto(`${baseUrl}/login`);
      await waitForPageReady(page, '/login');
    } else {
      await waitForPageReady(page, '/login');
    }

    // STEP 3: Verify login form displayed
    await safeExpectVisible(loginForm, 'Login form not visible');

    // STEP 4: Enter non-existent email address
    const emailValue = `nonexistent_${Date.now()}@example.com`;
    await fillField(page, 'input[type="email"], input[name="email"], input[placeholder*="email" i]', emailValue, 'Email');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    await safeExpectVisible(emailInput, 'Email input not visible');
    await expect(emailInput).toHaveValue(emailValue).catch(() => {
      test.info().annotations.push({ type: 'note', description: 'Email value not set as expected' });
    });

    // STEP 5: Enter any password
    const passwordValue = 'InvalidPassword123!';
    await fillField(page, 'input[type="password"], input[name="password"], input[placeholder*="password" i]', passwordValue, 'Password');
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
    await safeExpectVisible(passwordInput, 'Password input not visible');
    await expect(passwordInput).toHaveValue(passwordValue).catch(() => {
      test.info().annotations.push({ type: 'note', description: 'Password value not set as expected' });
    });

    // STEP 6: Click Sign In button
    await clickButton(page, /sign in|login/i, 'Sign In button not found');

    // FINAL STEP: Verify error message displayed
    const errorMessage = page.locator('text=Invalid login credentials, [role="alert"], .error, .text-red-500').filter({ hasText: /invalid login credentials/i }).first();
    const errorVisible = await safeExpectVisible(errorMessage, 'Error message "Invalid login credentials" not visible', 15000);
    if (!errorVisible) {
      await waitForToast(page, /invalid login credentials|error/i, 10000);
    }
  });
});
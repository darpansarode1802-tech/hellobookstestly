import { test, expect, chromium } from '@playwright/test';

test('Verify Login Functionality - Hellobooks', async () => {

  // Launch Browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to Login Page
  await page.goto('https://beta.hellobooks.ai/login');

  // Enter Username (Email)
  await page.fill('#input_your_working_email', 'darpansarode@gmail.com');

  // Enter Password
  await page.fill('#input_password', 'Darpan@18');

  // Click Sign In Button
  await page.click("//button//*[text()='Sign In']");

  // Wait for Dashboard URL
  await page.waitForURL('**/dashboard');

  // Verify URL contains 'dashboard'
  await expect(page).toHaveURL(/dashboard/);

  console.log("Login Successful - Dashboard Loaded");

  // Take Screenshot
  await page.screenshot({ path: `example-${browser.browserType().name()}.png` });

  // Close Browser
  await browser.close();

});

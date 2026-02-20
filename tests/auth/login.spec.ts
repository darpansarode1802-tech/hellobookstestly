import { test, expect } from '@playwright/test';

test('Verify Login Functionality - Hellobooks', async ({ page }) => {

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

});

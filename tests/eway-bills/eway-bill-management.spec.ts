import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth';

test('tests/eway-bills/eway-bill-management.spec.ts', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard/);
});

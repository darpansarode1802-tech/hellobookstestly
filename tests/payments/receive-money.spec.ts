import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth';

test('tests/payments/receive-money.spec.ts', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard/);
});

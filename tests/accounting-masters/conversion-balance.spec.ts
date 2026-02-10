import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth';

test('tests/accounting-masters/conversion-balance.spec.ts', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard/);
});

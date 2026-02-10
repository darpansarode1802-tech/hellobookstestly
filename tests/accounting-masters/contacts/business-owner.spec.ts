import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth';

test('tests/accounting-masters/contacts/business-owner.spec.ts', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/dashboard/);
});

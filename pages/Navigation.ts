import { Page } from '@playwright/test';

export class Navigation {
  constructor(private page: Page) {}

  async goTo(menu: string) {
    await this.page.click(`text=${menu}`);
  }
}

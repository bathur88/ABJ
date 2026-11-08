import { expect, type Page } from '@playwright/test';

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async startFromCart() {
    await this.page.getByTestId('checkout').click();
  }

  async fillDetails(firstName: string, lastName: string, postalCode: string) {
    await this.page.getByTestId('firstName').fill(firstName);
    await this.page.getByTestId('lastName').fill(lastName);
    await this.page.getByTestId('postalCode').fill(postalCode);
    await this.page.getByTestId('continue').click();
  }

  async finish() {
    await this.page.getByTestId('finish').click();
  }

  async expectComplete() {
    await expect(this.page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
  }
}

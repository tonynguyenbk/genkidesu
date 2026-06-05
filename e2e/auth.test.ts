import { test, expect } from '@playwright/test';

const TEST_PHONE = '0912345678';

test.describe('Auth flow', () => {
  test('phone OTP login end-to-end', async ({ page }) => {
    await page.goto('/');

    // Wait for redirect to login
    await page.waitForURL(/login|phone-otp/, { timeout: 10000 });

    // Click phone login button
    await page.getByText(/Số điện thoại|điện thoại/i).first().click();
    await page.waitForURL(/phone-otp/, { timeout: 5000 });

    // Fill phone number
    await page.locator('input').first().fill(TEST_PHONE);

    // Click "Gửi mã xác thực" — triggers API call
    await page.getByText(/Gửi mã/i).first().click();

    // Wait for OTP step (dev banner appears)
    await expect(page.getByText(/Dev mode/i)).toBeVisible({ timeout: 10000 });

    // OTP is auto-filled from devOtp — just click confirm
    await page.getByText(/Xác nhận/i).first().click();

    // Should reach home screen
    await page.waitForFunction(
      () => !window.location.href.includes('phone-otp') && !window.location.href.includes('login'),
      { timeout: 15000 },
    );

    await expect(page.getByText(/Xin chào/i).first()).toBeVisible({ timeout: 8000 });
  });
});

import { test, expect, type Page } from '@playwright/test';

const PERSONA_PHONE = '0911222333';

async function loginWithPhone(page: Page, phone: string) {
  await page.goto('/');
  await page.waitForURL(/login|phone-otp/, { timeout: 10000 });
  await page.getByText(/Số điện thoại|điện thoại/i).first().click();
  await page.waitForURL(/phone-otp/, { timeout: 5000 });
  await page.locator('input').first().fill(phone);
  await page.getByText(/Gửi mã/i).first().click();
  await expect(page.getByText(/Dev mode/i)).toBeVisible({ timeout: 10000 });
  await page.getByText(/Xác nhận/i).first().click();
  await page.waitForFunction(
    () => !window.location.href.includes('phone-otp') && !window.location.href.includes('login'),
    { timeout: 15000 },
  );
}

test.describe('Multi-persona UI', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithPhone(page, PERSONA_PHONE);
  });

  test('home screen renders for adult profile', async ({ page }) => {
    await expect(page.getByText(/Xin chào/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/kcal/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Bữa ăn hôm nay/i)).toBeVisible({ timeout: 5000 });
  });

  test('baby feed screen step 1 — feed type selection', async ({ page }) => {
    await page.goto('/baby-feed');
    await expect(page.getByText('Loại bữa ăn')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sữa mẹ')).toBeVisible();
    await expect(page.getByText('Sữa công thức')).toBeVisible();
    await expect(page.getByText('Ăn dặm')).toBeVisible();
  });

  test('baby feed screen step 2 — amount input', async ({ page }) => {
    await page.goto('/baby-feed');
    // Click "Tiếp theo"
    await page.getByText('Tiếp theo').click();
    // Step 2: amount input
    await expect(page.getByText('Số lượng')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/ml/i).first()).toBeVisible();
    // Nutrition preview
    await expect(page.getByText('Dinh dưỡng ước tính')).toBeVisible();
  });

  test('baby feed selects formula type', async ({ page }) => {
    await page.goto('/baby-feed');
    await page.getByText('Sữa công thức').click();
    // Should be selected (pink accent)
    await expect(page.getByText('Sữa công thức')).toBeVisible();
    await page.getByText('Tiếp theo').click();
    await expect(page.getByText(/Sữa công thức/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('camera screen renders', async ({ page }) => {
    // Navigate to camera tab
    const cameraLink = page.getByRole('link').filter({ hasText: /Ghi nhận|Camera/i }).first();
    if (await cameraLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cameraLink.click();
    } else {
      await page.goto('/(tabs)/camera');
    }
    await expect(page.getByText('Ghi nhận bữa ăn')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Nhập tay món ăn')).toBeVisible({ timeout: 3000 });
  });
});

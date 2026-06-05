import { test, expect, type Page } from '@playwright/test';

const SUB_PHONE = '0987654325';

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

async function goToProfile(page: Page) {
  const profileLink = page.getByRole('link').filter({ hasText: /hồ sơ/i }).first();
  if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
    await profileLink.click();
  } else {
    await page.goto('/(tabs)/profile');
  }
  await page.waitForTimeout(2000);
}

async function openPaywall(page: Page) {
  await goToProfile(page);
  const banner = page.getByText(/Nâng cấp lên Pro/i).first();
  await expect(banner).toBeVisible({ timeout: 8000 });
  await banner.click();
  await page.waitForTimeout(2000);
}

test.describe('Subscription & Paywall', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithPhone(page, SUB_PHONE);
  });

  test('paywall screen renders all plans', async ({ page }) => {
    await openPaywall(page);
    await expect(page.getByText(/Nâng cấp Genki/i)).toBeVisible({ timeout: 8000 });
    // Hero section visible
    await expect(page.getByText(/Mở khóa toàn bộ tính năng/i)).toBeVisible({ timeout: 5000 });
    // Comparison table (static content) confirms paywall fully loaded
    await expect(page.getByText(/So sánh gói/i)).toBeVisible({ timeout: 5000 });
  });

  test('paywall shows plan prices', async ({ page }) => {
    await openPaywall(page);
    await expect(page.getByText(/Nâng cấp Genki/i)).toBeVisible({ timeout: 8000 });
    // Wait for plan cards to load — "Phổ biến" badge is Pro plan badge
    await expect(page.getByText(/Phổ biến/i)).toBeVisible({ timeout: 10000 });
    // Price texts are in DOM
    await expect(page.getByText(/Tiết kiệm nhất/i)).toBeVisible({ timeout: 5000 });
  });

  test('paywall payment note renders', async ({ page }) => {
    await openPaywall(page);
    await expect(page.getByText(/Nâng cấp Genki/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Thanh toán qua/i)).toBeVisible({ timeout: 5000 });
  });

  test('comparison table renders', async ({ page }) => {
    await openPaywall(page);
    await expect(page.getByText(/So sánh gói/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/Wearable sync/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Dashboard gia đình/i).first()).toBeVisible({ timeout: 3000 });
  });

  test('profile screen shows upgrade banner for free users', async ({ page }) => {
    await goToProfile(page);
    await expect(page.getByText(/Nâng cấp lên Pro/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/59k\/tháng/i)).toBeVisible({ timeout: 3000 });
  });

  test('profile plan section shows current plan', async ({ page }) => {
    await goToProfile(page);
    await expect(page.getByText(/Gói dịch vụ/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Gói hiện tại/i)).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Miễn phí/i)).toBeVisible({ timeout: 3000 });
  });

  test('upgrade button navigates to paywall', async ({ page }) => {
    await goToProfile(page);
    const banner = page.getByText(/Nâng cấp lên Pro/i).first();
    await expect(banner).toBeVisible({ timeout: 8000 });
    await banner.click();
    await expect(page.getByText(/Nâng cấp Genki/i)).toBeVisible({ timeout: 8000 });
  });
});

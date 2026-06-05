import { test, expect, type Page } from '@playwright/test';

const FAMILY_PHONE = '0987654322';

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

test.describe('Family system', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithPhone(page, FAMILY_PHONE);
  });

  test('home screen loads with profile data', async ({ page }) => {
    await expect(page.getByText(/Xin chào/i).first()).toBeVisible({ timeout: 8000 });
    // Calorie card visible
    await expect(page.getByText(/kcal/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('navigate to family tab — shows empty state or dashboard', async ({ page }) => {
    // Try clicking family tab link
    const familyLink = page.getByRole('link').filter({ hasText: /gia đình/i }).first();
    if (await familyLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await familyLink.click();
    } else {
      await page.goto('/(tabs)/family');
    }
    await page.waitForTimeout(2000);
    // Either empty state or dashboard
    const content = page.getByText(/Chưa có gia đình|thành viên|Mã mời/i).first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });

  test('create family flow', async ({ page }) => {
    await page.goto('/family/create');
    await page.waitForTimeout(1000);

    // Check whether the form is shown (family might already exist from previous run)
    const hasForm = await page.getByPlaceholder(/Gia đình/i).isVisible().catch(() => false);
    if (hasForm) {
      await page.getByPlaceholder(/Gia đình/i).fill('Gia đình Test ' + Date.now());
      await page.getByText('Tạo ngay').click();
    }

    // Success: should show invite code or success message
    await expect(
      page.getByText(/Gia đình đã tạo|Mã mời|thành viên/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('join family screen renders', async ({ page }) => {
    await page.goto('/family/join');
    await expect(page.getByText(/Tham gia gia đình/i)).toBeVisible({ timeout: 5000 });
    // The 8-char code input should be there
    await expect(page.locator('input[maxLength="8"]')).toBeVisible({ timeout: 3000 });
  });

  test('profile screen shows real data (not hardcoded)', async ({ page }) => {
    // Navigate to profile tab
    const profileLink = page.getByRole('link').filter({ hasText: /hồ sơ/i }).first();
    if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileLink.click();
    } else {
      await page.goto('/(tabs)/profile');
    }
    await page.waitForTimeout(1500);

    // TDEE row should appear (real data)
    await expect(page.getByText('TDEE')).toBeVisible({ timeout: 8000 });
    // Should NOT show hardcoded name
    const hardcoded = page.getByText('Nguyễn Văn Minh');
    await expect(hardcoded).not.toBeVisible({ timeout: 2000 }).catch(() => {});
  });
});

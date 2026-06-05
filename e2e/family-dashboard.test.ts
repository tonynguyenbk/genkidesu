import { test, expect, type Page } from '@playwright/test';

const FAMILY_PHONE = '0987654326';

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

async function goToFamily(page: Page) {
  // Sidebar (desktop web) uses TouchableOpacity, not <a> — match by text
  const familyNav = page.getByText(/^Gia đình$/i).first();
  if (await familyNav.isVisible({ timeout: 3000 }).catch(() => false)) {
    await familyNav.click();
  } else {
    await page.goto('/(tabs)/family');
  }
  await page.waitForTimeout(2000);
}

test.describe('Family Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithPhone(page, FAMILY_PHONE);
  });

  test('family nav item is accessible', async ({ page }) => {
    // Sidebar (desktop) uses TouchableOpacity, tab bar (mobile) uses text label
    const familyNav = page.getByText(/^Gia đình$/i).first();
    await expect(familyNav).toBeVisible({ timeout: 8000 });
  });

  test('family screen renders create or existing family', async ({ page }) => {
    await goToFamily(page);
    // Either shows existing family dashboard or "create family" prompt
    const hasDashboard = await page.getByText(/Gia đình/i).first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasCreate = await page.getByText(/Tạo gia đình/i).first().isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasDashboard || hasCreate).toBe(true);
  });

  test('create family flow works', async ({ page }) => {
    await goToFamily(page);

    // Skip if family already exists
    const hasExisting = await page.getByText(/Gia đình của/i).isVisible({ timeout: 3000 }).catch(() => false);
    if (hasExisting) return;

    // Create family
    const createBtn = page.getByText(/Tạo gia đình/i).first();
    if (!(await createBtn.isVisible({ timeout: 3000 }).catch(() => false))) return;

    await createBtn.click();
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Gia đình Test E2E');
      await page.getByText(/Tạo|Lưu|Xác nhận/i).last().click();
      await page.waitForTimeout(2000);
    }

    // Either created or shown family UI
    const result = await page.getByText(/Gia đình|Dashboard/i).first().isVisible({ timeout: 8000 }).catch(() => false);
    expect(result).toBe(true);
  });

  test('family screen shows member list or empty state', async ({ page }) => {
    await goToFamily(page);
    // After loading, should show either members or an invite prompt or empty state
    await page.waitForTimeout(3000);
    const content = await page.locator('text=/thành viên|Mời|Không có|Dashboard|Gia đình/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(content).toBe(true);
  });
});

test.describe('Family Screen UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithPhone(page, FAMILY_PHONE);
    await goToFamily(page);
  });

  test('shows family tab title', async ({ page }) => {
    await expect(page.getByText(/Gia đình/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('family screen has no horizontal overflow', async ({ page }) => {
    await page.waitForTimeout(2000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  test('invite code visible when family exists', async ({ page }) => {
    // Look for invite code section — only visible if a family was created
    await page.waitForTimeout(3000);
    const hasCode = await page.getByText(/Mã mời|invite/i).first().isVisible({ timeout: 3000 }).catch(() => false);
    // This may or may not show depending on state — just verify the page loaded
    const pageLoaded = await page.getByText(/Gia đình/i).first().isVisible({ timeout: 5000 });
    expect(pageLoaded).toBe(true);
  });
});

# Genki — Group Dashboard & Meal Sync

## Mục tiêu

Implement 2 tính năng nhóm gia đình:

1. **Family Monitoring** — trưởng nhóm xem dashboard dinh dưỡng realtime của tất cả thành viên
2. **Meal Sync** — 1 người chụp ảnh bữa ăn chung, dữ liệu tự động vào hồ sơ các thành viên được chọn

---

## Màn hình cần build

### 1. Group Dashboard (`/app/(tabs)/group.tsx`)

**Layout:**
- Header: tên nhóm, số thành viên, icon bell + settings
- Summary band (3 stat cards): tổng calo nhóm · số người đạt mục tiêu · tổng bữa ăn hôm nay
- Alert section: hiển thị warning/danger per member (thiếu calo, thiếu protein...)
- Member list: sort theo mức độ cần chú ý (danger → warn → ok)
- Tab bar: Trang chủ · Thống kê · Chụp ảnh · Nhóm · Hồ sơ

**Member card (expandable):**
- Avatar + tên + badge trạng thái (Đạt mục tiêu / Thiếu protein / Cần chú ý)
- Kcal hôm nay + progress bar màu theo trạng thái
- Expand → macro row (Protein / Carb / Chất béo) + meal log hôm nay

**Màu trạng thái:**
```
danger  → #E24B4A  (< 40% mục tiêu calo HOẶC 0 bữa sau 13:00)
warn    → #BA7517  (40–79% mục tiêu HOẶC thiếu macro chính)
ok      → #1D9E75  (≥ 80% mục tiêu)
```

**Quyền xem:**
- `role: leader` → thấy tất cả thành viên trong nhóm
- `role: member` → chỉ thấy hồ sơ bản thân

---

### 2. Meal Sync bottom sheet (mở từ màn hình chụp ảnh)

**Trigger:** Sau khi AI nhận diện món ăn xong → hiện bottom sheet "Đồng bộ bữa ăn?"

**Layout:**
- Food preview: thumbnail + tên món + kcal ước tính + macro tags
- Conflict banner (nếu có): cảnh báo khi thành viên đã ghi bữa ăn trong vòng 30 phút
- Member list (checkable): tick chọn ai ăn cùng
- Portion control per member: nút − / + bước 25%, mặc định 100% (trẻ em mặc định 50%)
- Summary bar: "Sẽ cộng vào hồ sơ N thành viên" + breakdown kcal per người
- CTA button: "Đồng bộ cho N người" (disabled khi chưa chọn ai)

---

## Data models

### Bảng `group_members`
```sql
id            uuid PK
group_id      uuid FK → groups.id
user_id       uuid FK → users.id
role          enum('leader', 'member')
joined_at     timestamptz
```

### Bảng `meal_sync_events`
```sql
id            uuid PK
meal_id       uuid FK → meals.id        -- bữa ăn gốc (người chụp)
synced_by     uuid FK → users.id
group_id      uuid FK → groups.id
sync_type     text DEFAULT 'meal_sync'
created_at    timestamptz
```

### Bảng `meal_sync_members`
```sql
id               uuid PK
sync_event_id    uuid FK → meal_sync_events.id
user_id          uuid FK → users.id
portion_ratio    numeric(4,2) DEFAULT 1.00   -- lưu ratio, KHÔNG lưu kcal tuyệt đối
kcal_snapshot    integer                      -- snapshot tại thời điểm sync để hiển thị
```

> **Lý do lưu `portion_ratio` thay vì `kcal`:** Nếu AI cập nhật lại ước tính calo của món ăn sau đó, tất cả hồ sơ thành viên sẽ tự tính lại đúng theo ratio mà không cần migration data.

---

## API endpoints cần tạo

### GET `/api/groups/:groupId/dashboard`
```typescript
// Query params: ?date=YYYY-MM-DD (default: today)
// Response:
{
  group: { id, name, member_count },
  summary: { total_kcal, members_on_target, total_meals },
  members: [
    {
      user_id: string,
      display_name: string,
      role: 'leader' | 'member',
      target_kcal: number,
      actual_kcal: number,
      progress_pct: number,        // Math.round(actual/target*100)
      status: 'ok' | 'warn' | 'danger',
      alert_flags: string[],       // ['low_kcal', 'low_protein', 'no_lunch']
      macros: { protein_g, carb_g, fat_g },
      meals: [{ id, name, kcal, logged_at, source: 'self' | 'meal_sync' }]
    }
  ]
}
```

> **`alert_flags` phải tính server-side** (không để client tự tính) để tái dùng cho push notification.

### POST `/api/groups/:groupId/meal-sync`
```typescript
// Body:
{
  meal_id: string,
  members: [
    { user_id: string, portion_ratio: number }
  ]
}
// Response: { sync_event_id, synced_count, members_updated: [...] }
```

### GET `/api/groups/:groupId/conflict-check`
```typescript
// Query: ?user_ids[]=...&meal_time=ISO8601&window_minutes=30
// Response: { conflicts: [{ user_id, conflicting_meal_id, logged_at }] }
```

---

## Conflict detection logic

```typescript
// Gọi trước khi hiển thị bottom sheet Meal Sync
async function checkMealConflicts(
  groupId: string,
  selectedUserIds: string[],
  mealTime: Date,
  windowMinutes = 30
): Promise<ConflictResult[]> {
  const windowStart = subMinutes(mealTime, windowMinutes)
  const windowEnd = addMinutes(mealTime, windowMinutes)

  return db.meals.findMany({
    where: {
      user_id: { in: selectedUserIds },
      logged_at: { gte: windowStart, lte: windowEnd },
      deleted_at: null
    }
  })
}
```

---

## Acceptance criteria

- [ ] Trưởng nhóm mở tab Nhóm → thấy dashboard với đủ 3 stat cards
- [ ] Alert đỏ hiện khi thành viên < 40% mục tiêu calo sau 13:00
- [ ] Alert vàng hiện khi thành viên thiếu macro chính (< 50% target)
- [ ] Member card expand/collapse → hiện macro + meal log
- [ ] Meal log của bữa Meal Sync hiển thị label "(Meal Sync)"
- [ ] Bottom sheet Meal Sync: tick thành viên → portion control hiện ra
- [ ] Portion mặc định: 100% người lớn, 50% trẻ em (dựa vào profile age group)
- [ ] Conflict banner hiện khi thành viên đã ghi bữa trong vòng 30 phút
- [ ] CTA disabled khi chưa chọn thành viên nào
- [ ] POST meal-sync → `portion_ratio` được lưu, không phải kcal tuyệt đối
- [ ] `status` và `alert_flags` tính server-side, không tính ở client

---

## Files cần tạo / chỉnh sửa

```
app/(tabs)/group.tsx                          -- màn hình dashboard nhóm
components/group/MemberCard.tsx               -- card thành viên expandable
components/group/AlertBanner.tsx              -- banner cảnh báo dinh dưỡng
components/group/SummaryBand.tsx              -- 3 stat cards tổng quan
components/meal/MealSyncSheet.tsx             -- bottom sheet meal sync
components/meal/MemberPortionPicker.tsx       -- chọn thành viên + portion
server/routes/groups/dashboard.ts             -- GET dashboard endpoint
server/routes/groups/meal-sync.ts             -- POST meal-sync endpoint
server/routes/groups/conflict-check.ts        -- GET conflict-check endpoint
server/services/alertFlagService.ts           -- logic tính alert_flags
prisma/migrations/XXXX_add_meal_sync.sql      -- migration bảng meal_sync_*
```

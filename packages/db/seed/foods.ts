// Vietnamese food nutritional data
// Sources: Bảng thành phần thực phẩm Việt Nam (Viện Dinh dưỡng), USDA FoodData Central
// Values per 100g unless noted. typicalPortionG = khẩu phần thường dùng.

export const foods = [
  // ─────────────────────────────────────────
  // BỮA SÁNG (30 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Phở bò tái', nameEn: 'Beef pho (rare)', category: 'breakfast', region: 'north',
    calPer100g: 46, proteinPer100g: 3.5, carbsPer100g: 5.2, fatPer100g: 1.3, fiberPer100g: 0.3,
    typicalPortionG: 500, verified: true,
    micronutrientsPer100g: { sodium_mg: 580, calcium_mg: 12, iron_mg: 0.8, vitamin_b12_mcg: 0.4 },
  },
  {
    nameVi: 'Phở gà', nameEn: 'Chicken pho', category: 'breakfast', region: 'north',
    calPer100g: 42, proteinPer100g: 3.2, carbsPer100g: 5.0, fatPer100g: 0.9, fiberPer100g: 0.2,
    typicalPortionG: 500, verified: true,
    micronutrientsPer100g: { sodium_mg: 520, calcium_mg: 10, iron_mg: 0.5 },
  },
  {
    nameVi: 'Phở bò chín', nameEn: 'Beef pho (well-done)', category: 'breakfast', region: 'north',
    calPer100g: 48, proteinPer100g: 3.8, carbsPer100g: 5.2, fatPer100g: 1.5, fiberPer100g: 0.3,
    typicalPortionG: 500, verified: true,
  },
  {
    nameVi: 'Bún bò Huế', nameEn: 'Hue beef noodle soup', category: 'breakfast', region: 'central',
    calPer100g: 52, proteinPer100g: 4.1, carbsPer100g: 6.3, fatPer100g: 1.5, fiberPer100g: 0.4,
    typicalPortionG: 500, verified: true,
    micronutrientsPer100g: { sodium_mg: 640, calcium_mg: 14, iron_mg: 1.0 },
  },
  {
    nameVi: 'Bún riêu cua', nameEn: 'Crab noodle soup', category: 'breakfast', region: 'north',
    calPer100g: 44, proteinPer100g: 3.6, carbsPer100g: 5.5, fatPer100g: 1.0, fiberPer100g: 0.5,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Bún thịt nướng', nameEn: 'Grilled pork vermicelli', category: 'breakfast', region: 'south',
    calPer100g: 148, proteinPer100g: 9.2, carbsPer100g: 18.0, fatPer100g: 4.2, fiberPer100g: 1.0,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Bánh mì thịt', nameEn: 'Pork banh mi', category: 'breakfast', region: 'south',
    calPer100g: 230, proteinPer100g: 12.0, carbsPer100g: 28.0, fatPer100g: 8.0, fiberPer100g: 1.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { sodium_mg: 480, calcium_mg: 25, iron_mg: 1.8 },
  },
  {
    nameVi: 'Bánh mì trứng', nameEn: 'Egg banh mi', category: 'breakfast', region: 'common',
    calPer100g: 210, proteinPer100g: 9.5, carbsPer100g: 27.0, fatPer100g: 7.0, fiberPer100g: 1.2,
    typicalPortionG: 130, verified: true,
  },
  {
    nameVi: 'Bánh mì chả', nameEn: 'Vietnamese pate banh mi', category: 'breakfast', region: 'south',
    calPer100g: 245, proteinPer100g: 11.0, carbsPer100g: 28.5, fatPer100g: 9.5, fiberPer100g: 1.2,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Xôi xéo', nameEn: 'Sticky rice with mung bean', category: 'breakfast', region: 'north',
    calPer100g: 180, proteinPer100g: 5.0, carbsPer100g: 35.0, fatPer100g: 3.0, fiberPer100g: 1.0,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Xôi gà', nameEn: 'Sticky rice with chicken', category: 'breakfast', region: 'common',
    calPer100g: 195, proteinPer100g: 9.5, carbsPer100g: 30.0, fatPer100g: 4.5, fiberPer100g: 0.8,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Xôi lạc', nameEn: 'Sticky rice with peanuts', category: 'breakfast', region: 'north',
    calPer100g: 215, proteinPer100g: 6.8, carbsPer100g: 35.5, fatPer100g: 5.5, fiberPer100g: 1.5,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Bánh cuốn nhân thịt', nameEn: 'Steamed rice rolls with pork', category: 'breakfast', region: 'north',
    calPer100g: 120, proteinPer100g: 7.0, carbsPer100g: 18.0, fatPer100g: 2.5, fiberPer100g: 0.5,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Bánh cuốn trứng', nameEn: 'Steamed rice rolls with egg', category: 'breakfast', region: 'north',
    calPer100g: 135, proteinPer100g: 7.5, carbsPer100g: 18.5, fatPer100g: 3.5, fiberPer100g: 0.4,
    typicalPortionG: 230, verified: true,
  },
  {
    nameVi: 'Cháo trắng', nameEn: 'Plain rice porridge', category: 'breakfast', region: 'common',
    calPer100g: 65, proteinPer100g: 1.5, carbsPer100g: 14.0, fatPer100g: 0.2, fiberPer100g: 0.1,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Cháo gà', nameEn: 'Chicken congee', category: 'breakfast', region: 'common',
    calPer100g: 72, proteinPer100g: 4.8, carbsPer100g: 10.5, fatPer100g: 1.2, fiberPer100g: 0.2,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Cháo cá', nameEn: 'Fish congee', category: 'breakfast', region: 'south',
    calPer100g: 68, proteinPer100g: 5.2, carbsPer100g: 9.8, fatPer100g: 0.9, fiberPer100g: 0.2,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Bánh bao nhân thịt', nameEn: 'Steamed pork bun', category: 'breakfast', region: 'common',
    calPer100g: 218, proteinPer100g: 10.5, carbsPer100g: 32.0, fatPer100g: 5.5, fiberPer100g: 0.8,
    typicalPortionG: 100, verified: true,
  },
  {
    nameVi: 'Bánh bao nhân trứng', nameEn: 'Steamed egg bun', category: 'breakfast', region: 'common',
    calPer100g: 205, proteinPer100g: 8.5, carbsPer100g: 33.0, fatPer100g: 4.8, fiberPer100g: 0.7,
    typicalPortionG: 100, verified: true,
  },
  {
    nameVi: 'Hủ tiếu Nam Vang', nameEn: 'Phnom Penh noodle soup', category: 'breakfast', region: 'south',
    calPer100g: 55, proteinPer100g: 4.5, carbsPer100g: 6.8, fatPer100g: 1.2, fiberPer100g: 0.3,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Mì Quảng', nameEn: 'Quang noodles', category: 'breakfast', region: 'central',
    calPer100g: 125, proteinPer100g: 7.5, carbsPer100g: 17.0, fatPer100g: 3.0, fiberPer100g: 0.8,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Bánh ướt chả lụa', nameEn: 'Soft rice crepe with pork roll', category: 'breakfast', region: 'south',
    calPer100g: 115, proteinPer100g: 6.2, carbsPer100g: 17.5, fatPer100g: 2.0, fiberPer100g: 0.3,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Bánh mì ốp la', nameEn: 'Banh mi with fried egg', category: 'breakfast', region: 'south',
    calPer100g: 220, proteinPer100g: 10.0, carbsPer100g: 25.0, fatPer100g: 9.0, fiberPer100g: 1.0,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Bún ốc', nameEn: 'Snail noodle soup', category: 'breakfast', region: 'north',
    calPer100g: 48, proteinPer100g: 4.0, carbsPer100g: 5.8, fatPer100g: 1.0, fiberPer100g: 0.4,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Bánh đúc nóng', nameEn: 'Warm rice cake with mince', category: 'breakfast', region: 'north',
    calPer100g: 95, proteinPer100g: 4.5, carbsPer100g: 15.0, fatPer100g: 1.8, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Xôi chiên phồng', nameEn: 'Puffed fried sticky rice', category: 'breakfast', region: 'south',
    calPer100g: 285, proteinPer100g: 5.5, carbsPer100g: 50.0, fatPer100g: 7.5, fiberPer100g: 0.5,
    typicalPortionG: 100, verified: true,
  },
  {
    nameVi: 'Hủ tiếu khô', nameEn: 'Dry noodles with pork', category: 'breakfast', region: 'south',
    calPer100g: 158, proteinPer100g: 9.5, carbsPer100g: 22.0, fatPer100g: 3.5, fiberPer100g: 0.5,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Bánh giò', nameEn: 'Steamed rice dumpling', category: 'breakfast', region: 'north',
    calPer100g: 145, proteinPer100g: 5.5, carbsPer100g: 22.0, fatPer100g: 3.8, fiberPer100g: 0.5,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Bánh mì que', nameEn: 'Vietnamese breadstick', category: 'breakfast', region: 'common',
    calPer100g: 265, proteinPer100g: 8.5, carbsPer100g: 50.0, fatPer100g: 3.5, fiberPer100g: 1.5,
    typicalPortionG: 60, verified: true,
  },
  {
    nameVi: 'Bún mắm', nameEn: 'Fermented fish noodle soup', category: 'breakfast', region: 'south',
    calPer100g: 60, proteinPer100g: 5.0, carbsPer100g: 7.2, fatPer100g: 1.0, fiberPer100g: 0.5,
    typicalPortionG: 450, verified: true,
  },

  // ─────────────────────────────────────────
  // MÓN CHÍNH (50 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Cơm tấm sườn nướng', nameEn: 'Broken rice with grilled pork', category: 'main_dish', region: 'south',
    calPer100g: 165, proteinPer100g: 11.0, carbsPer100g: 22.0, fatPer100g: 4.5, fiberPer100g: 0.8,
    typicalPortionG: 400, verified: true,
    micronutrientsPer100g: { iron_mg: 1.5, calcium_mg: 18, zinc_mg: 2.1 },
  },
  {
    nameVi: 'Cơm tấm bì chả', nameEn: 'Broken rice with shredded pork skin', category: 'main_dish', region: 'south',
    calPer100g: 172, proteinPer100g: 10.5, carbsPer100g: 23.0, fatPer100g: 5.0, fiberPer100g: 0.7,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Bún chả Hà Nội', nameEn: 'Hanoi grilled pork noodles', category: 'main_dish', region: 'north',
    calPer100g: 145, proteinPer100g: 12.0, carbsPer100g: 16.0, fatPer100g: 4.0, fiberPer100g: 0.5,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Cơm chiên dương châu', nameEn: 'Yangzhou fried rice', category: 'main_dish', region: 'common',
    calPer100g: 185, proteinPer100g: 7.5, carbsPer100g: 28.0, fatPer100g: 5.5, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Cơm chiên trứng', nameEn: 'Egg fried rice', category: 'main_dish', region: 'common',
    calPer100g: 175, proteinPer100g: 6.5, carbsPer100g: 27.5, fatPer100g: 5.0, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Mì xào bò', nameEn: 'Stir-fried noodles with beef', category: 'main_dish', region: 'common',
    calPer100g: 168, proteinPer100g: 10.5, carbsPer100g: 22.0, fatPer100g: 4.0, fiberPer100g: 1.5,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Mì xào giòn', nameEn: 'Crispy fried noodles', category: 'main_dish', region: 'common',
    calPer100g: 210, proteinPer100g: 8.5, carbsPer100g: 28.0, fatPer100g: 7.5, fiberPer100g: 1.2,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Cơm rang hải sản', nameEn: 'Seafood fried rice', category: 'main_dish', region: 'common',
    calPer100g: 178, proteinPer100g: 9.5, carbsPer100g: 26.0, fatPer100g: 4.5, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Bún bò xào', nameEn: 'Stir-fried beef with vermicelli', category: 'main_dish', region: 'south',
    calPer100g: 155, proteinPer100g: 11.0, carbsPer100g: 18.5, fatPer100g: 4.2, fiberPer100g: 1.0,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Phở xào', nameEn: 'Stir-fried pho noodles', category: 'main_dish', region: 'common',
    calPer100g: 162, proteinPer100g: 9.0, carbsPer100g: 22.5, fatPer100g: 4.5, fiberPer100g: 1.0,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Cơm gà xối mỡ', nameEn: 'Crispy chicken rice', category: 'main_dish', region: 'south',
    calPer100g: 195, proteinPer100g: 14.0, carbsPer100g: 22.0, fatPer100g: 6.5, fiberPer100g: 0.5,
    typicalPortionG: 380, verified: true,
  },
  {
    nameVi: 'Cơm hải sản', nameEn: 'Mixed seafood rice', category: 'main_dish', region: 'common',
    calPer100g: 158, proteinPer100g: 10.5, carbsPer100g: 22.0, fatPer100g: 3.5, fiberPer100g: 0.6,
    typicalPortionG: 380, verified: true,
  },
  {
    nameVi: 'Bánh xèo', nameEn: 'Vietnamese sizzling crepe', category: 'main_dish', region: 'south',
    calPer100g: 198, proteinPer100g: 8.5, carbsPer100g: 22.0, fatPer100g: 9.0, fiberPer100g: 1.5,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Gỏi cuốn tôm thịt', nameEn: 'Fresh spring rolls with shrimp and pork', category: 'main_dish', region: 'south',
    calPer100g: 95, proteinPer100g: 6.5, carbsPer100g: 14.0, fatPer100g: 1.5, fiberPer100g: 1.0,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { calcium_mg: 30, iron_mg: 0.8 },
  },
  {
    nameVi: 'Chả giò chiên', nameEn: 'Fried spring rolls', category: 'main_dish', region: 'south',
    calPer100g: 285, proteinPer100g: 9.5, carbsPer100g: 28.0, fatPer100g: 15.0, fiberPer100g: 1.5,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Cơm trắng + thức ăn', nameEn: 'Steamed rice with side dishes', category: 'main_dish', region: 'common',
    calPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28.0, fatPer100g: 0.3, fiberPer100g: 0.3,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Bún đậu mắm tôm', nameEn: 'Vermicelli with fried tofu and shrimp paste', category: 'main_dish', region: 'north',
    calPer100g: 168, proteinPer100g: 9.5, carbsPer100g: 22.0, fatPer100g: 4.5, fiberPer100g: 1.5,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Miến xào', nameEn: 'Stir-fried glass noodles', category: 'main_dish', region: 'common',
    calPer100g: 155, proteinPer100g: 5.5, carbsPer100g: 28.5, fatPer100g: 2.8, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Cơm niêu', nameEn: 'Clay pot rice', category: 'main_dish', region: 'common',
    calPer100g: 145, proteinPer100g: 6.5, carbsPer100g: 24.0, fatPer100g: 2.8, fiberPer100g: 0.6,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Bánh căn', nameEn: 'Grilled rice cake', category: 'main_dish', region: 'central',
    calPer100g: 142, proteinPer100g: 6.0, carbsPer100g: 22.5, fatPer100g: 3.2, fiberPer100g: 0.5,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Cao lầu Hội An', nameEn: 'Hoi An noodles', category: 'main_dish', region: 'central',
    calPer100g: 162, proteinPer100g: 10.5, carbsPer100g: 22.0, fatPer100g: 4.0, fiberPer100g: 1.0,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Bún thái hải sản', nameEn: 'Thai-style seafood vermicelli', category: 'main_dish', region: 'south',
    calPer100g: 75, proteinPer100g: 5.5, carbsPer100g: 9.5, fatPer100g: 1.5, fiberPer100g: 0.8,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Cơm rang dưa bò', nameEn: 'Beef with pickled mustard fried rice', category: 'main_dish', region: 'south',
    calPer100g: 188, proteinPer100g: 9.5, carbsPer100g: 26.5, fatPer100g: 5.5, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Bánh tráng trộn', nameEn: 'Mixed rice paper salad', category: 'main_dish', region: 'south',
    calPer100g: 168, proteinPer100g: 5.5, carbsPer100g: 28.0, fatPer100g: 4.5, fiberPer100g: 1.8,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Bánh đa cua', nameEn: 'Crab noodles Hai Phong', category: 'main_dish', region: 'north',
    calPer100g: 62, proteinPer100g: 5.2, carbsPer100g: 8.0, fatPer100g: 0.8, fiberPer100g: 0.6,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Cơm gà Hội An', nameEn: 'Hoi An chicken rice', category: 'main_dish', region: 'central',
    calPer100g: 168, proteinPer100g: 12.5, carbsPer100g: 20.5, fatPer100g: 4.5, fiberPer100g: 0.5,
    typicalPortionG: 380, verified: true,
  },
  {
    nameVi: 'Bún kèn', nameEn: 'Fish coconut curry noodles', category: 'main_dish', region: 'south',
    calPer100g: 82, proteinPer100g: 5.5, carbsPer100g: 9.8, fatPer100g: 2.5, fiberPer100g: 0.8,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Lẩu thái hải sản', nameEn: 'Thai seafood hot pot', category: 'main_dish', region: 'common',
    calPer100g: 48, proteinPer100g: 4.8, carbsPer100g: 4.5, fatPer100g: 1.2, fiberPer100g: 0.8,
    typicalPortionG: 500, verified: true,
  },
  {
    nameVi: 'Lẩu bò', nameEn: 'Beef hot pot', category: 'main_dish', region: 'common',
    calPer100g: 55, proteinPer100g: 5.8, carbsPer100g: 4.5, fatPer100g: 1.8, fiberPer100g: 0.8,
    typicalPortionG: 500, verified: true,
  },
  {
    nameVi: 'Mì hoành thánh', nameEn: 'Wonton noodle soup', category: 'main_dish', region: 'south',
    calPer100g: 65, proteinPer100g: 4.5, carbsPer100g: 9.0, fatPer100g: 1.2, fiberPer100g: 0.4,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Bún suông', nameEn: 'Shrimp paste noodle soup', category: 'main_dish', region: 'south',
    calPer100g: 55, proteinPer100g: 4.2, carbsPer100g: 7.5, fatPer100g: 0.9, fiberPer100g: 0.5,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Bánh hỏi heo quay', nameEn: 'Woven rice noodles with roast pork', category: 'main_dish', region: 'south',
    calPer100g: 178, proteinPer100g: 9.5, carbsPer100g: 22.0, fatPer100g: 5.8, fiberPer100g: 0.5,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Cháo lòng', nameEn: 'Pork organ congee', category: 'main_dish', region: 'south',
    calPer100g: 75, proteinPer100g: 5.5, carbsPer100g: 10.5, fatPer100g: 1.5, fiberPer100g: 0.2,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Bún mọc', nameEn: 'Pork ball noodle soup', category: 'main_dish', region: 'north',
    calPer100g: 58, proteinPer100g: 4.8, carbsPer100g: 7.2, fatPer100g: 1.2, fiberPer100g: 0.3,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Cơm tấm ba chỉ nướng', nameEn: 'Broken rice with grilled pork belly', category: 'main_dish', region: 'south',
    calPer100g: 185, proteinPer100g: 10.5, carbsPer100g: 20.0, fatPer100g: 7.5, fiberPer100g: 0.5,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Mì tôm xào', nameEn: 'Stir-fried instant noodles with shrimp', category: 'main_dish', region: 'common',
    calPer100g: 178, proteinPer100g: 8.5, carbsPer100g: 24.0, fatPer100g: 5.5, fiberPer100g: 1.0,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Bánh xèo miền Trung', nameEn: 'Central Vietnamese sizzling crepe', category: 'main_dish', region: 'central',
    calPer100g: 180, proteinPer100g: 7.5, carbsPer100g: 23.0, fatPer100g: 7.5, fiberPer100g: 1.2,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Bún nghệ', nameEn: 'Turmeric fish noodles', category: 'main_dish', region: 'central',
    calPer100g: 72, proteinPer100g: 6.0, carbsPer100g: 9.5, fatPer100g: 0.8, fiberPer100g: 0.5,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Cơm sườn chiên', nameEn: 'Rice with fried pork ribs', category: 'main_dish', region: 'common',
    calPer100g: 195, proteinPer100g: 13.5, carbsPer100g: 22.0, fatPer100g: 6.0, fiberPer100g: 0.5,
    typicalPortionG: 380, verified: true,
  },
  {
    nameVi: 'Mì vịt tiềm', nameEn: 'Duck noodle soup', category: 'main_dish', region: 'south',
    calPer100g: 72, proteinPer100g: 5.8, carbsPer100g: 8.5, fatPer100g: 2.0, fiberPer100g: 0.4,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Bánh đa nem', nameEn: 'Fried spring roll rice paper', category: 'main_dish', region: 'north',
    calPer100g: 165, proteinPer100g: 5.5, carbsPer100g: 30.5, fatPer100g: 3.0, fiberPer100g: 0.8,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Phở khô Gia Lai', nameEn: 'Dry pho Gia Lai style', category: 'main_dish', region: 'central',
    calPer100g: 148, proteinPer100g: 9.5, carbsPer100g: 20.0, fatPer100g: 3.5, fiberPer100g: 0.5,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Bún giò heo', nameEn: 'Pork knuckle noodle soup', category: 'main_dish', region: 'south',
    calPer100g: 68, proteinPer100g: 5.2, carbsPer100g: 8.2, fatPer100g: 2.0, fiberPer100g: 0.3,
    typicalPortionG: 450, verified: true,
  },
  {
    nameVi: 'Cơm thố gà', nameEn: 'Chicken clay pot rice', category: 'main_dish', region: 'south',
    calPer100g: 162, proteinPer100g: 11.0, carbsPer100g: 22.0, fatPer100g: 3.8, fiberPer100g: 0.5,
    typicalPortionG: 380, verified: true,
  },
  {
    nameVi: 'Miến gà', nameEn: 'Chicken glass noodle soup', category: 'main_dish', region: 'north',
    calPer100g: 58, proteinPer100g: 4.5, carbsPer100g: 8.5, fatPer100g: 0.8, fiberPer100g: 0.2,
    typicalPortionG: 400, verified: true,
  },
  {
    nameVi: 'Bánh ướt lòng gà', nameEn: 'Soft rice crepe with chicken innards', category: 'main_dish', region: 'central',
    calPer100g: 125, proteinPer100g: 7.5, carbsPer100g: 18.0, fatPer100g: 2.8, fiberPer100g: 0.4,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Lẩu mắm', nameEn: 'Fermented fish hot pot', category: 'main_dish', region: 'south',
    calPer100g: 52, proteinPer100g: 5.2, carbsPer100g: 5.5, fatPer100g: 1.0, fiberPer100g: 1.0,
    typicalPortionG: 500, verified: true,
  },
  {
    nameVi: 'Cơm rang mắm ruốc', nameEn: 'Fried rice with fermented shrimp paste', category: 'main_dish', region: 'central',
    calPer100g: 175, proteinPer100g: 7.5, carbsPer100g: 28.5, fatPer100g: 4.0, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
  },

  // ─────────────────────────────────────────
  // CANH / SOUP (30 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Canh chua cá lóc', nameEn: 'Sour fish soup', category: 'soup', region: 'south',
    calPer100g: 38, proteinPer100g: 3.8, carbsPer100g: 3.5, fatPer100g: 0.8, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 12, calcium_mg: 22 },
  },
  {
    nameVi: 'Canh khổ qua nhồi thịt', nameEn: 'Bitter melon stuffed with pork soup', category: 'soup', region: 'south',
    calPer100g: 42, proteinPer100g: 3.5, carbsPer100g: 3.8, fatPer100g: 1.2, fiberPer100g: 1.2,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 35, iron_mg: 0.5 },
  },
  {
    nameVi: 'Canh bí đỏ nấu tôm', nameEn: 'Pumpkin and shrimp soup', category: 'soup', region: 'common',
    calPer100g: 32, proteinPer100g: 2.5, carbsPer100g: 4.5, fatPer100g: 0.4, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_a_mcg: 550, vitamin_c_mg: 8 },
  },
  {
    nameVi: 'Canh cải nấu thịt', nameEn: 'Mustard greens with pork soup', category: 'soup', region: 'common',
    calPer100g: 28, proteinPer100g: 2.8, carbsPer100g: 2.0, fatPer100g: 0.8, fiberPer100g: 0.8,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 30, calcium_mg: 45 },
  },
  {
    nameVi: 'Canh rau muống', nameEn: 'Water spinach soup', category: 'soup', region: 'common',
    calPer100g: 18, proteinPer100g: 1.8, carbsPer100g: 2.2, fatPer100g: 0.2, fiberPer100g: 1.2,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 28, calcium_mg: 60, iron_mg: 2.5 },
  },
  {
    nameVi: 'Canh cua đồng', nameEn: 'Field crab soup', category: 'soup', region: 'north',
    calPer100g: 35, proteinPer100g: 3.5, carbsPer100g: 2.8, fatPer100g: 0.8, fiberPer100g: 0.6,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { calcium_mg: 85, iron_mg: 3.2 },
  },
  {
    nameVi: 'Canh ngao nấu dưa', nameEn: 'Clam with pickled mustard soup', category: 'soup', region: 'north',
    calPer100g: 28, proteinPer100g: 3.2, carbsPer100g: 2.0, fatPer100g: 0.5, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { calcium_mg: 55, iron_mg: 4.5 },
  },
  {
    nameVi: 'Canh sườn non nấu khoai', nameEn: 'Pork rib and potato soup', category: 'soup', region: 'common',
    calPer100g: 52, proteinPer100g: 3.8, carbsPer100g: 6.2, fatPer100g: 1.5, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Canh hến', nameEn: 'Baby clam soup', category: 'soup', region: 'central',
    calPer100g: 25, proteinPer100g: 3.0, carbsPer100g: 1.5, fatPer100g: 0.4, fiberPer100g: 0.2,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { iron_mg: 5.5, calcium_mg: 80 },
  },
  {
    nameVi: 'Canh mướp nấu tôm', nameEn: 'Luffa and shrimp soup', category: 'soup', region: 'south',
    calPer100g: 22, proteinPer100g: 2.2, carbsPer100g: 2.8, fatPer100g: 0.3, fiberPer100g: 0.6,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Canh đậu hũ nấu cà chua', nameEn: 'Tofu and tomato soup', category: 'soup', region: 'common',
    calPer100g: 30, proteinPer100g: 2.5, carbsPer100g: 2.8, fatPer100g: 1.0, fiberPer100g: 0.5,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 15, calcium_mg: 42 },
  },
  {
    nameVi: 'Canh thịt hầm củ cải', nameEn: 'Braised pork with daikon', category: 'soup', region: 'north',
    calPer100g: 48, proteinPer100g: 4.0, carbsPer100g: 3.5, fatPer100g: 1.8, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Canh gà nấu nấm', nameEn: 'Chicken and mushroom soup', category: 'soup', region: 'common',
    calPer100g: 38, proteinPer100g: 4.5, carbsPer100g: 2.2, fatPer100g: 1.2, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Canh cá nấu cà', nameEn: 'Fish and tomato soup', category: 'soup', region: 'north',
    calPer100g: 32, proteinPer100g: 3.8, carbsPer100g: 2.5, fatPer100g: 0.5, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 12 },
  },
  {
    nameVi: 'Canh bắp chuối', nameEn: 'Banana blossom soup', category: 'soup', region: 'south',
    calPer100g: 25, proteinPer100g: 1.8, carbsPer100g: 4.2, fatPer100g: 0.3, fiberPer100g: 2.5,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Canh khoai mỡ', nameEn: 'Purple yam soup', category: 'soup', region: 'south',
    calPer100g: 42, proteinPer100g: 1.5, carbsPer100g: 9.0, fatPer100g: 0.2, fiberPer100g: 1.0,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { potassium_mg: 280 },
  },
  {
    nameVi: 'Canh lá lốt', nameEn: 'Wild betel leaf soup', category: 'soup', region: 'south',
    calPer100g: 28, proteinPer100g: 2.2, carbsPer100g: 2.8, fatPer100g: 0.8, fiberPer100g: 1.5,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Canh giá đỗ nấu sườn', nameEn: 'Bean sprout and rib soup', category: 'soup', region: 'south',
    calPer100g: 35, proteinPer100g: 3.5, carbsPer100g: 2.0, fatPer100g: 1.2, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Canh rau đay nấu cua', nameEn: 'Jute leaf and crab soup', category: 'soup', region: 'north',
    calPer100g: 22, proteinPer100g: 2.5, carbsPer100g: 1.5, fatPer100g: 0.5, fiberPer100g: 1.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { calcium_mg: 95, iron_mg: 2.8 },
  },
  {
    nameVi: 'Canh sấu nấu sườn', nameEn: 'Sour fruit and pork rib soup', category: 'soup', region: 'north',
    calPer100g: 38, proteinPer100g: 3.2, carbsPer100g: 3.8, fatPer100g: 0.8, fiberPer100g: 0.5,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Canh cải xanh thịt bằm', nameEn: 'Bok choy with minced pork', category: 'soup', region: 'common',
    calPer100g: 30, proteinPer100g: 3.0, carbsPer100g: 2.0, fatPer100g: 1.0, fiberPer100g: 1.0,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 45, calcium_mg: 65 },
  },
  {
    nameVi: 'Canh bắp cải', nameEn: 'Cabbage soup', category: 'soup', region: 'common',
    calPer100g: 18, proteinPer100g: 1.2, carbsPer100g: 3.0, fatPer100g: 0.2, fiberPer100g: 1.2,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 38 },
  },
  {
    nameVi: 'Canh đuôi bò', nameEn: 'Oxtail soup', category: 'soup', region: 'common',
    calPer100g: 65, proteinPer100g: 6.5, carbsPer100g: 1.5, fatPer100g: 4.0, fiberPer100g: 0.2,
    typicalPortionG: 350, verified: true,
    micronutrientsPer100g: { calcium_mg: 35, collagen_mg: 580 },
  },
  {
    nameVi: 'Canh chua lá me', nameEn: 'Tamarind leaf sour soup', category: 'soup', region: 'south',
    calPer100g: 28, proteinPer100g: 2.5, carbsPer100g: 3.2, fatPer100g: 0.5, fiberPer100g: 1.2,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Canh nấm kim châm thịt bò', nameEn: 'Enoki mushroom and beef soup', category: 'soup', region: 'common',
    calPer100g: 38, proteinPer100g: 4.5, carbsPer100g: 2.2, fatPer100g: 1.0, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Canh bầu nấu tôm', nameEn: 'Bottle gourd and shrimp soup', category: 'soup', region: 'common',
    calPer100g: 20, proteinPer100g: 2.0, carbsPer100g: 2.5, fatPer100g: 0.3, fiberPer100g: 0.5,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Canh su hào thịt bằm', nameEn: 'Kohlrabi and minced pork soup', category: 'soup', region: 'north',
    calPer100g: 28, proteinPer100g: 2.5, carbsPer100g: 3.2, fatPer100g: 0.5, fiberPer100g: 0.8,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 55 },
  },
  {
    nameVi: 'Canh chua tôm', nameEn: 'Sour shrimp soup', category: 'soup', region: 'south',
    calPer100g: 32, proteinPer100g: 3.0, carbsPer100g: 3.2, fatPer100g: 0.5, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 10, calcium_mg: 35 },
  },
  {
    nameVi: 'Canh ngót thịt bằm', nameEn: 'Katuk leaf soup with minced pork', category: 'soup', region: 'common',
    calPer100g: 25, proteinPer100g: 2.8, carbsPer100g: 1.8, fatPer100g: 0.5, fiberPer100g: 0.8,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { protein_mg: 8500, vitamin_c_mg: 50 },
  },
  {
    nameVi: 'Canh thập cẩm', nameEn: 'Mixed vegetable soup', category: 'soup', region: 'common',
    calPer100g: 22, proteinPer100g: 1.8, carbsPer100g: 3.2, fatPer100g: 0.3, fiberPer100g: 1.2,
    typicalPortionG: 300, verified: true,
  },

  // ─────────────────────────────────────────
  // RAU / SALAD (20 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Rau muống xào tỏi', nameEn: 'Stir-fried water spinach with garlic', category: 'vegetable', region: 'common',
    calPer100g: 42, proteinPer100g: 2.5, carbsPer100g: 4.5, fatPer100g: 1.5, fiberPer100g: 2.0,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 25, iron_mg: 2.2, calcium_mg: 55 },
  },
  {
    nameVi: 'Cải thìa xào', nameEn: 'Stir-fried baby bok choy', category: 'vegetable', region: 'common',
    calPer100g: 32, proteinPer100g: 1.8, carbsPer100g: 3.5, fatPer100g: 1.2, fiberPer100g: 1.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 42, calcium_mg: 72 },
  },
  {
    nameVi: 'Đậu cô ve xào', nameEn: 'Stir-fried green beans', category: 'vegetable', region: 'common',
    calPer100g: 38, proteinPer100g: 2.0, carbsPer100g: 5.8, fatPer100g: 1.0, fiberPer100g: 2.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 18, iron_mg: 1.2 },
  },
  {
    nameVi: 'Bông cải xanh hấp', nameEn: 'Steamed broccoli', category: 'vegetable', region: 'common',
    calPer100g: 28, proteinPer100g: 2.5, carbsPer100g: 4.2, fatPer100g: 0.3, fiberPer100g: 2.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 82, vitamin_k_mcg: 78, folate_mcg: 48 },
  },
  {
    nameVi: 'Gỏi ngó sen tôm thịt', nameEn: 'Lotus stem salad with shrimp and pork', category: 'vegetable', region: 'south',
    calPer100g: 68, proteinPer100g: 5.5, carbsPer100g: 7.5, fatPer100g: 1.5, fiberPer100g: 1.8,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Gỏi bắp chuối', nameEn: 'Banana blossom salad', category: 'vegetable', region: 'south',
    calPer100g: 55, proteinPer100g: 3.8, carbsPer100g: 7.2, fatPer100g: 1.2, fiberPer100g: 2.5,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Gỏi đu đủ khô bò', nameEn: 'Papaya salad with dried beef', category: 'vegetable', region: 'south',
    calPer100g: 72, proteinPer100g: 5.5, carbsPer100g: 9.0, fatPer100g: 1.8, fiberPer100g: 1.5,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Dưa cải muối', nameEn: 'Pickled mustard greens', category: 'vegetable', region: 'common',
    calPer100g: 15, proteinPer100g: 1.2, carbsPer100g: 2.5, fatPer100g: 0.2, fiberPer100g: 1.2,
    typicalPortionG: 80, verified: true,
  },
  {
    nameVi: 'Rau cải xanh luộc', nameEn: 'Boiled Chinese mustard greens', category: 'vegetable', region: 'common',
    calPer100g: 18, proteinPer100g: 1.8, carbsPer100g: 2.2, fatPer100g: 0.2, fiberPer100g: 1.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 35, calcium_mg: 65 },
  },
  {
    nameVi: 'Đậu hũ chiên', nameEn: 'Fried tofu', category: 'vegetable', region: 'common',
    calPer100g: 175, proteinPer100g: 11.0, carbsPer100g: 6.5, fatPer100g: 12.0, fiberPer100g: 0.5,
    typicalPortionG: 100, verified: true,
    micronutrientsPer100g: { calcium_mg: 120, iron_mg: 2.8 },
  },
  {
    nameVi: 'Cà pháo muối', nameEn: 'Pickled Thai eggplant', category: 'vegetable', region: 'north',
    calPer100g: 22, proteinPer100g: 1.0, carbsPer100g: 4.5, fatPer100g: 0.2, fiberPer100g: 2.8,
    typicalPortionG: 80, verified: true,
  },
  {
    nameVi: 'Cải bó xôi xào', nameEn: 'Stir-fried spinach', category: 'vegetable', region: 'common',
    calPer100g: 35, proteinPer100g: 2.8, carbsPer100g: 3.2, fatPer100g: 1.2, fiberPer100g: 1.8,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { iron_mg: 2.5, calcium_mg: 85, vitamin_a_mcg: 380 },
  },
  {
    nameVi: 'Nấm xào', nameEn: 'Stir-fried mushrooms', category: 'vegetable', region: 'common',
    calPer100g: 38, proteinPer100g: 3.5, carbsPer100g: 4.5, fatPer100g: 1.2, fiberPer100g: 2.0,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_d_iu: 12, potassium_mg: 310 },
  },
  {
    nameVi: 'Mướp xào tỏi', nameEn: 'Stir-fried luffa with garlic', category: 'vegetable', region: 'common',
    calPer100g: 28, proteinPer100g: 1.2, carbsPer100g: 4.8, fatPer100g: 0.8, fiberPer100g: 0.8,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Ngô luộc', nameEn: 'Boiled corn', category: 'vegetable', region: 'common',
    calPer100g: 86, proteinPer100g: 3.2, carbsPer100g: 18.5, fatPer100g: 1.2, fiberPer100g: 2.5,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { vitamin_b3_mg: 1.5, folate_mcg: 42 },
  },
  {
    nameVi: 'Gỏi dưa leo tôm', nameEn: 'Cucumber salad with shrimp', category: 'vegetable', region: 'common',
    calPer100g: 42, proteinPer100g: 4.0, carbsPer100g: 4.2, fatPer100g: 0.8, fiberPer100g: 0.8,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Cà tím nướng', nameEn: 'Grilled eggplant with green onion', category: 'vegetable', region: 'north',
    calPer100g: 45, proteinPer100g: 1.5, carbsPer100g: 8.5, fatPer100g: 1.0, fiberPer100g: 2.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { potassium_mg: 230 },
  },
  {
    nameVi: 'Su hào xào thịt', nameEn: 'Kohlrabi stir-fried with pork', category: 'vegetable', region: 'north',
    calPer100g: 48, proteinPer100g: 4.0, carbsPer100g: 5.8, fatPer100g: 1.2, fiberPer100g: 1.2,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 48 },
  },
  {
    nameVi: 'Rau bí xào tỏi', nameEn: 'Pumpkin shoots stir-fried', category: 'vegetable', region: 'south',
    calPer100g: 28, proteinPer100g: 2.0, carbsPer100g: 3.8, fatPer100g: 0.8, fiberPer100g: 1.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { calcium_mg: 45, iron_mg: 1.8 },
  },
  {
    nameVi: 'Đậu bắp luộc', nameEn: 'Boiled okra', category: 'vegetable', region: 'south',
    calPer100g: 28, proteinPer100g: 1.8, carbsPer100g: 5.2, fatPer100g: 0.2, fiberPer100g: 2.8,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 18, folate_mcg: 60, calcium_mg: 58 },
  },

  // ─────────────────────────────────────────
  // THỊT / CÁ / TRỨNG (20 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Trứng chiên', nameEn: 'Fried egg', category: 'protein', region: 'common',
    calPer100g: 196, proteinPer100g: 13.6, carbsPer100g: 0.4, fatPer100g: 15.3, fiberPer100g: 0,
    typicalPortionG: 60, verified: true,
    micronutrientsPer100g: { vitamin_d_iu: 87, vitamin_b12_mcg: 0.9, choline_mg: 294 },
  },
  {
    nameVi: 'Thịt kho tàu', nameEn: 'Vietnamese braised pork belly', category: 'protein', region: 'south',
    calPer100g: 265, proteinPer100g: 15.5, carbsPer100g: 4.5, fatPer100g: 20.5, fiberPer100g: 0,
    typicalPortionG: 120, verified: true,
  },
  {
    nameVi: 'Cá kho tộ', nameEn: 'Caramelized fish in clay pot', category: 'protein', region: 'south',
    calPer100g: 168, proteinPer100g: 18.5, carbsPer100g: 6.5, fatPer100g: 7.5, fiberPer100g: 0,
    typicalPortionG: 100, verified: true,
    micronutrientsPer100g: { omega3_mg: 580, vitamin_d_iu: 220 },
  },
  {
    nameVi: 'Tôm rang muối', nameEn: 'Salt-fried shrimp', category: 'protein', region: 'common',
    calPer100g: 145, proteinPer100g: 20.5, carbsPer100g: 5.5, fatPer100g: 4.2, fiberPer100g: 0,
    typicalPortionG: 100, verified: true,
    micronutrientsPer100g: { calcium_mg: 70, iodine_mcg: 35 },
  },
  {
    nameVi: 'Gà chiên nước mắm', nameEn: 'Fried chicken with fish sauce', category: 'protein', region: 'south',
    calPer100g: 245, proteinPer100g: 22.5, carbsPer100g: 8.5, fatPer100g: 14.0, fiberPer100g: 0,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Cá chiên giòn', nameEn: 'Crispy fried fish', category: 'protein', region: 'common',
    calPer100g: 220, proteinPer100g: 18.5, carbsPer100g: 10.5, fatPer100g: 11.0, fiberPer100g: 0.2,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { omega3_mg: 420 },
  },
  {
    nameVi: 'Bò lúc lắc', nameEn: 'Shaking beef', category: 'protein', region: 'south',
    calPer100g: 215, proteinPer100g: 20.5, carbsPer100g: 6.5, fatPer100g: 12.0, fiberPer100g: 0.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { iron_mg: 3.5, zinc_mg: 4.2 },
  },
  {
    nameVi: 'Thịt nướng chả', nameEn: 'Grilled pork meatballs', category: 'protein', region: 'north',
    calPer100g: 255, proteinPer100g: 18.5, carbsPer100g: 5.5, fatPer100g: 18.0, fiberPer100g: 0,
    typicalPortionG: 100, verified: true,
  },
  {
    nameVi: 'Mực chiên', nameEn: 'Fried squid', category: 'protein', region: 'common',
    calPer100g: 198, proteinPer100g: 16.5, carbsPer100g: 14.5, fatPer100g: 8.0, fiberPer100g: 0,
    typicalPortionG: 100, verified: true,
  },
  {
    nameVi: 'Chả lụa', nameEn: 'Vietnamese pork roll', category: 'protein', region: 'common',
    calPer100g: 175, proteinPer100g: 16.5, carbsPer100g: 8.5, fatPer100g: 8.5, fiberPer100g: 0,
    typicalPortionG: 80, verified: true,
  },
  {
    nameVi: 'Thịt heo quay', nameEn: 'Roast pork', category: 'protein', region: 'south',
    calPer100g: 305, proteinPer100g: 19.5, carbsPer100g: 2.5, fatPer100g: 24.5, fiberPer100g: 0,
    typicalPortionG: 100, verified: true,
  },
  {
    nameVi: 'Cá basa kho', nameEn: 'Braised basa fish', category: 'protein', region: 'south',
    calPer100g: 138, proteinPer100g: 16.5, carbsPer100g: 4.5, fatPer100g: 6.0, fiberPer100g: 0,
    typicalPortionG: 120, verified: true,
  },
  {
    nameVi: 'Đậu hũ hấp gừng', nameEn: 'Steamed tofu with ginger', category: 'protein', region: 'common',
    calPer100g: 82, proteinPer100g: 8.5, carbsPer100g: 3.5, fatPer100g: 4.2, fiberPer100g: 0.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { calcium_mg: 135, iron_mg: 2.2 },
  },
  {
    nameVi: 'Gà luộc', nameEn: 'Poached chicken', category: 'protein', region: 'common',
    calPer100g: 165, proteinPer100g: 25.0, carbsPer100g: 0, fatPer100g: 7.0, fiberPer100g: 0,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_b3_mg: 8.5, phosphorus_mg: 220 },
  },
  {
    nameVi: 'Trứng luộc', nameEn: 'Boiled egg', category: 'protein', region: 'common',
    calPer100g: 155, proteinPer100g: 12.5, carbsPer100g: 1.1, fatPer100g: 10.8, fiberPer100g: 0,
    typicalPortionG: 60, verified: true,
    micronutrientsPer100g: { vitamin_d_iu: 82, choline_mg: 286, vitamin_b12_mcg: 0.9 },
  },
  {
    nameVi: 'Thịt bò xào ớt chuông', nameEn: 'Beef stir-fried with bell peppers', category: 'protein', region: 'common',
    calPer100g: 148, proteinPer100g: 14.5, carbsPer100g: 6.5, fatPer100g: 7.0, fiberPer100g: 1.2,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 45, iron_mg: 2.8 },
  },
  {
    nameVi: 'Cá thu kho', nameEn: 'Braised mackerel', category: 'protein', region: 'north',
    calPer100g: 155, proteinPer100g: 18.5, carbsPer100g: 3.5, fatPer100g: 7.5, fiberPer100g: 0,
    typicalPortionG: 100, verified: true,
    micronutrientsPer100g: { omega3_mg: 1200, vitamin_d_iu: 380 },
  },
  {
    nameVi: 'Sườn xào chua ngọt', nameEn: 'Sweet and sour pork ribs', category: 'protein', region: 'common',
    calPer100g: 198, proteinPer100g: 12.5, carbsPer100g: 12.5, fatPer100g: 11.5, fiberPer100g: 0.5,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Tôm rang sả ớt', nameEn: 'Lemongrass chili shrimp', category: 'protein', region: 'south',
    calPer100g: 125, proteinPer100g: 19.5, carbsPer100g: 5.5, fatPer100g: 3.0, fiberPer100g: 0.5,
    typicalPortionG: 100, verified: true,
  },
  {
    nameVi: 'Cá hấp gừng hành', nameEn: 'Steamed fish with ginger and scallion', category: 'protein', region: 'common',
    calPer100g: 108, proteinPer100g: 18.5, carbsPer100g: 1.5, fatPer100g: 3.2, fiberPer100g: 0.2,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { omega3_mg: 380, selenium_mcg: 36 },
  },

  // ─────────────────────────────────────────
  // ĐỒ UỐNG (15 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Cà phê sữa đá', nameEn: 'Vietnamese iced milk coffee', category: 'drink', region: 'common',
    calPer100g: 62, proteinPer100g: 1.8, carbsPer100g: 10.5, fatPer100g: 1.8, fiberPer100g: 0,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { caffeine_mg: 40, calcium_mg: 55 },
  },
  {
    nameVi: 'Trà sữa trân châu', nameEn: 'Bubble milk tea', category: 'drink', region: 'common',
    calPer100g: 78, proteinPer100g: 1.5, carbsPer100g: 15.8, fatPer100g: 1.2, fiberPer100g: 0,
    typicalPortionG: 500, verified: true,
  },
  {
    nameVi: 'Nước mía', nameEn: 'Sugarcane juice', category: 'drink', region: 'south',
    calPer100g: 45, proteinPer100g: 0.2, carbsPer100g: 11.2, fatPer100g: 0.1, fiberPer100g: 0,
    typicalPortionG: 350, verified: true,
  },
  {
    nameVi: 'Sinh tố bơ', nameEn: 'Avocado smoothie', category: 'drink', region: 'south',
    calPer100g: 95, proteinPer100g: 1.5, carbsPer100g: 9.5, fatPer100g: 6.5, fiberPer100g: 1.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_e_mg: 1.8, potassium_mg: 185 },
  },
  {
    nameVi: 'Sinh tố xoài', nameEn: 'Mango smoothie', category: 'drink', region: 'south',
    calPer100g: 75, proteinPer100g: 0.8, carbsPer100g: 18.5, fatPer100g: 0.5, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 28, vitamin_a_mcg: 240 },
  },
  {
    nameVi: 'Nước dừa', nameEn: 'Coconut water', category: 'drink', region: 'south',
    calPer100g: 19, proteinPer100g: 0.7, carbsPer100g: 3.7, fatPer100g: 0.2, fiberPer100g: 1.1,
    typicalPortionG: 350, verified: true,
    micronutrientsPer100g: { potassium_mg: 250, magnesium_mg: 25 },
  },
  {
    nameVi: 'Trà đá', nameEn: 'Iced tea', category: 'drink', region: 'common',
    calPer100g: 2, proteinPer100g: 0, carbsPer100g: 0.5, fatPer100g: 0, fiberPer100g: 0,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Cà phê đen', nameEn: 'Black coffee', category: 'drink', region: 'common',
    calPer100g: 8, proteinPer100g: 0.3, carbsPer100g: 1.5, fatPer100g: 0.1, fiberPer100g: 0,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { caffeine_mg: 40 },
  },
  {
    nameVi: 'Sữa đậu nành', nameEn: 'Soy milk', category: 'drink', region: 'common',
    calPer100g: 52, proteinPer100g: 3.5, carbsPer100g: 5.2, fatPer100g: 2.5, fiberPer100g: 0.3,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { calcium_mg: 25, vitamin_b12_mcg: 0.8, iron_mg: 0.5 },
  },
  {
    nameVi: 'Nước ép cam', nameEn: 'Orange juice', category: 'drink', region: 'common',
    calPer100g: 45, proteinPer100g: 0.7, carbsPer100g: 10.4, fatPer100g: 0.2, fiberPer100g: 0.2,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 50, potassium_mg: 200 },
  },
  {
    nameVi: 'Sinh tố dâu tây', nameEn: 'Strawberry smoothie', category: 'drink', region: 'common',
    calPer100g: 55, proteinPer100g: 1.2, carbsPer100g: 12.5, fatPer100g: 0.5, fiberPer100g: 0.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 35 },
  },
  {
    nameVi: 'Chanh muối', nameEn: 'Salted lemon drink', category: 'drink', region: 'common',
    calPer100g: 18, proteinPer100g: 0.2, carbsPer100g: 4.5, fatPer100g: 0, fiberPer100g: 0.1,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 15, sodium_mg: 180 },
  },
  {
    nameVi: 'Nước sâm', nameEn: 'Vietnamese herbal drink', category: 'drink', region: 'south',
    calPer100g: 38, proteinPer100g: 0.2, carbsPer100g: 9.5, fatPer100g: 0, fiberPer100g: 0.2,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Sữa tươi', nameEn: 'Fresh milk', category: 'drink', region: 'common',
    calPer100g: 62, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.2, fiberPer100g: 0,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { calcium_mg: 120, vitamin_d_iu: 40, vitamin_b12_mcg: 0.5 },
  },
  {
    nameVi: 'Yogurt', nameEn: 'Vietnamese yogurt', category: 'drink', region: 'common',
    calPer100g: 68, proteinPer100g: 3.5, carbsPer100g: 8.5, fatPer100g: 2.2, fiberPer100g: 0,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { calcium_mg: 110, vitamin_b12_mcg: 0.4 },
  },

  // ─────────────────────────────────────────
  // SNACK / TRÁNG MIỆNG (15 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Chè đậu xanh', nameEn: 'Mung bean sweet soup', category: 'dessert', region: 'common',
    calPer100g: 88, proteinPer100g: 3.5, carbsPer100g: 18.0, fatPer100g: 0.8, fiberPer100g: 2.2,
    typicalPortionG: 250, verified: true,
    micronutrientsPer100g: { iron_mg: 1.8, folate_mcg: 35 },
  },
  {
    nameVi: 'Chè ba màu', nameEn: 'Three-color dessert', category: 'dessert', region: 'south',
    calPer100g: 112, proteinPer100g: 2.5, carbsPer100g: 22.5, fatPer100g: 2.0, fiberPer100g: 1.5,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Bánh chuối nướng', nameEn: 'Baked banana cake', category: 'dessert', region: 'south',
    calPer100g: 172, proteinPer100g: 2.5, carbsPer100g: 32.5, fatPer100g: 4.5, fiberPer100g: 1.5,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Chuối hấp', nameEn: 'Steamed banana', category: 'dessert', region: 'south',
    calPer100g: 95, proteinPer100g: 1.2, carbsPer100g: 22.0, fatPer100g: 0.3, fiberPer100g: 2.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { potassium_mg: 358, vitamin_b6_mg: 0.4 },
  },
  {
    nameVi: 'Xoài cắt', nameEn: 'Fresh cut mango', category: 'dessert', region: 'south',
    calPer100g: 60, proteinPer100g: 0.8, carbsPer100g: 15.0, fatPer100g: 0.4, fiberPer100g: 1.6,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 36, vitamin_a_mcg: 54 },
  },
  {
    nameVi: 'Dưa hấu', nameEn: 'Watermelon', category: 'dessert', region: 'common',
    calPer100g: 30, proteinPer100g: 0.6, carbsPer100g: 7.6, fatPer100g: 0.2, fiberPer100g: 0.4,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 8, lycopene_mg: 4.5 },
  },
  {
    nameVi: 'Bánh flan', nameEn: 'Vietnamese crème caramel', category: 'dessert', region: 'common',
    calPer100g: 118, proteinPer100g: 4.2, carbsPer100g: 18.5, fatPer100g: 3.2, fiberPer100g: 0,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { calcium_mg: 92, vitamin_b12_mcg: 0.3 },
  },
  {
    nameVi: 'Chè thập cẩm', nameEn: 'Mixed sweet soup', category: 'dessert', region: 'south',
    calPer100g: 102, proteinPer100g: 2.5, carbsPer100g: 20.5, fatPer100g: 1.8, fiberPer100g: 1.5,
    typicalPortionG: 250, verified: true,
  },
  {
    nameVi: 'Bánh ít lá gai', nameEn: 'Ramie leaf sticky rice cake', category: 'dessert', region: 'central',
    calPer100g: 188, proteinPer100g: 3.5, carbsPer100g: 38.5, fatPer100g: 2.8, fiberPer100g: 1.5,
    typicalPortionG: 80, verified: true,
  },
  {
    nameVi: 'Bánh trôi nước', nameEn: 'Sweet rice balls', category: 'dessert', region: 'north',
    calPer100g: 195, proteinPer100g: 3.2, carbsPer100g: 38.0, fatPer100g: 4.0, fiberPer100g: 0.5,
    typicalPortionG: 150, verified: true,
  },
  {
    nameVi: 'Thạch dừa', nameEn: 'Coconut jelly', category: 'dessert', region: 'south',
    calPer100g: 28, proteinPer100g: 0.2, carbsPer100g: 7.0, fatPer100g: 0, fiberPer100g: 0.5,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Kem dừa', nameEn: 'Coconut ice cream', category: 'dessert', region: 'south',
    calPer100g: 178, proteinPer100g: 2.5, carbsPer100g: 22.5, fatPer100g: 9.5, fiberPer100g: 0.5,
    typicalPortionG: 120, verified: true,
  },
  {
    nameVi: 'Bánh tráng nướng', nameEn: 'Grilled rice paper with toppings', category: 'snack', region: 'central',
    calPer100g: 218, proteinPer100g: 6.5, carbsPer100g: 38.5, fatPer100g: 5.0, fiberPer100g: 0.5,
    typicalPortionG: 120, verified: true,
  },
  {
    nameVi: 'Đậu phộng rang', nameEn: 'Roasted peanuts', category: 'snack', region: 'common',
    calPer100g: 568, proteinPer100g: 26.0, carbsPer100g: 16.0, fatPer100g: 49.0, fiberPer100g: 8.5,
    typicalPortionG: 30, verified: true,
    micronutrientsPer100g: { vitamin_e_mg: 8.3, niacin_mg: 12.1, magnesium_mg: 168 },
  },
  {
    nameVi: 'Khoai lang nướng', nameEn: 'Baked sweet potato', category: 'snack', region: 'common',
    calPer100g: 90, proteinPer100g: 2.0, carbsPer100g: 20.7, fatPer100g: 0.1, fiberPer100g: 3.0,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { vitamin_a_mcg: 961, vitamin_c_mg: 19, potassium_mg: 337 },
  },

  // ─────────────────────────────────────────
  // SỮA CÔNG THỨC / ĂN DẶM (10 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Sữa mẹ', nameEn: 'Breast milk', category: 'baby_food', region: 'common',
    calPer100g: 70, proteinPer100g: 1.0, carbsPer100g: 7.0, fatPer100g: 4.4, fiberPer100g: 0,
    typicalPortionG: 120, verified: true,
    micronutrientsPer100g: { calcium_mg: 32, vitamin_d_iu: 2.5 },
  },
  {
    nameVi: 'Sữa công thức 0-6 tháng', nameEn: 'Infant formula 0-6 months', category: 'formula', region: 'common',
    calPer100g: 67, proteinPer100g: 1.5, carbsPer100g: 7.3, fatPer100g: 3.5, fiberPer100g: 0,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { calcium_mg: 45, vitamin_d_iu: 40, iron_mg: 0.8 },
  },
  {
    nameVi: 'Sữa công thức 6-12 tháng', nameEn: 'Follow-on formula 6-12 months', category: 'formula', region: 'common',
    calPer100g: 70, proteinPer100g: 1.8, carbsPer100g: 7.8, fatPer100g: 3.4, fiberPer100g: 0,
    typicalPortionG: 180, verified: true,
    micronutrientsPer100g: { calcium_mg: 55, vitamin_d_iu: 60, iron_mg: 1.2 },
  },
  {
    nameVi: 'Bột ăn dặm gạo', nameEn: 'Rice baby cereal', category: 'baby_food', region: 'common',
    calPer100g: 382, proteinPer100g: 7.2, carbsPer100g: 82.0, fatPer100g: 2.5, fiberPer100g: 1.0,
    typicalPortionG: 20, verified: true,
    micronutrientsPer100g: { iron_mg: 8.5, calcium_mg: 320 },
  },
  {
    nameVi: 'Cháo ăn dặm rau củ', nameEn: 'Baby vegetable porridge', category: 'baby_food', region: 'common',
    calPer100g: 45, proteinPer100g: 1.5, carbsPer100g: 9.0, fatPer100g: 0.5, fiberPer100g: 0.5,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_a_mcg: 120, vitamin_c_mg: 8 },
  },
  {
    nameVi: 'Khoai tây nghiền', nameEn: 'Mashed potato for baby', category: 'baby_food', region: 'common',
    calPer100g: 75, proteinPer100g: 1.8, carbsPer100g: 16.5, fatPer100g: 0.5, fiberPer100g: 1.2,
    typicalPortionG: 100, verified: true,
    micronutrientsPer100g: { vitamin_c_mg: 15, potassium_mg: 420 },
  },
  {
    nameVi: 'Chuối nghiền', nameEn: 'Mashed banana for baby', category: 'baby_food', region: 'common',
    calPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 22.8, fatPer100g: 0.3, fiberPer100g: 2.6,
    typicalPortionG: 80, verified: true,
    micronutrientsPer100g: { potassium_mg: 358, vitamin_b6_mg: 0.4 },
  },
  {
    nameVi: 'Bí đỏ hấp', nameEn: 'Steamed pumpkin for baby', category: 'baby_food', region: 'common',
    calPer100g: 26, proteinPer100g: 1.0, carbsPer100g: 6.5, fatPer100g: 0.1, fiberPer100g: 0.5,
    typicalPortionG: 100, verified: true,
    micronutrientsPer100g: { vitamin_a_mcg: 426, vitamin_c_mg: 9 },
  },
  {
    nameVi: 'Thịt gà xay nhuyễn', nameEn: 'Pureed chicken for baby', category: 'baby_food', region: 'common',
    calPer100g: 112, proteinPer100g: 18.5, carbsPer100g: 0, fatPer100g: 4.0, fiberPer100g: 0,
    typicalPortionG: 50, verified: true,
    micronutrientsPer100g: { iron_mg: 0.8, zinc_mg: 1.5 },
  },
  {
    nameVi: 'Lòng đỏ trứng', nameEn: 'Egg yolk for baby', category: 'baby_food', region: 'common',
    calPer100g: 322, proteinPer100g: 15.9, carbsPer100g: 3.6, fatPer100g: 26.5, fiberPer100g: 0,
    typicalPortionG: 20, verified: true,
    micronutrientsPer100g: { vitamin_d_iu: 218, choline_mg: 680, iron_mg: 2.8, vitamin_b12_mcg: 3.8 },
  },

  // ─────────────────────────────────────────
  // MÓN HEALTHY (10 món)
  // ─────────────────────────────────────────
  {
    nameVi: 'Salad gà ức', nameEn: 'Chicken breast salad', category: 'healthy', region: 'common',
    calPer100g: 72, proteinPer100g: 12.5, carbsPer100g: 3.5, fatPer100g: 1.2, fiberPer100g: 1.5,
    typicalPortionG: 300, verified: true,
  },
  {
    nameVi: 'Cơm gạo lứt', nameEn: 'Brown rice', category: 'healthy', region: 'common',
    calPer100g: 112, proteinPer100g: 2.3, carbsPer100g: 23.5, fatPer100g: 0.9, fiberPer100g: 1.8,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { magnesium_mg: 44, phosphorus_mg: 83, manganese_mg: 1.0 },
  },
  {
    nameVi: 'Ức gà nướng', nameEn: 'Grilled chicken breast', category: 'healthy', region: 'common',
    calPer100g: 165, proteinPer100g: 31.0, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { vitamin_b3_mg: 14.8, phosphorus_mg: 220, selenium_mcg: 28 },
  },
  {
    nameVi: 'Đậu lăng nấu súp', nameEn: 'Lentil soup', category: 'healthy', region: 'common',
    calPer100g: 62, proteinPer100g: 4.8, carbsPer100g: 10.5, fatPer100g: 0.4, fiberPer100g: 3.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { iron_mg: 3.3, folate_mcg: 120, potassium_mg: 365 },
  },
  {
    nameVi: 'Cá hồi áp chảo', nameEn: 'Pan-seared salmon', category: 'healthy', region: 'common',
    calPer100g: 208, proteinPer100g: 20.0, carbsPer100g: 0, fatPer100g: 13.5, fiberPer100g: 0,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { omega3_mg: 2260, vitamin_d_iu: 570, vitamin_b12_mcg: 3.2 },
  },
  {
    nameVi: 'Yến mạch cháo', nameEn: 'Oatmeal', category: 'healthy', region: 'common',
    calPer100g: 68, proteinPer100g: 2.5, carbsPer100g: 12.5, fatPer100g: 1.2, fiberPer100g: 1.8,
    typicalPortionG: 300, verified: true,
    micronutrientsPer100g: { iron_mg: 1.2, magnesium_mg: 25, beta_glucan_g: 0.8 },
  },
  {
    nameVi: 'Đậu hủ non hấp', nameEn: 'Silken tofu steamed', category: 'healthy', region: 'common',
    calPer100g: 55, proteinPer100g: 6.0, carbsPer100g: 2.5, fatPer100g: 2.5, fiberPer100g: 0.2,
    typicalPortionG: 150, verified: true,
    micronutrientsPer100g: { calcium_mg: 125, iron_mg: 1.8, magnesium_mg: 30 },
  },
  {
    nameVi: 'Bơ dầm sữa', nameEn: 'Avocado with condensed milk', category: 'healthy', region: 'south',
    calPer100g: 135, proteinPer100g: 1.5, carbsPer100g: 10.5, fatPer100g: 10.5, fiberPer100g: 4.5,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { vitamin_e_mg: 2.8, potassium_mg: 358, folate_mcg: 55 },
  },
  {
    nameVi: 'Granola sữa chua', nameEn: 'Yogurt with granola', category: 'healthy', region: 'common',
    calPer100g: 142, proteinPer100g: 5.5, carbsPer100g: 22.5, fatPer100g: 4.0, fiberPer100g: 2.5,
    typicalPortionG: 200, verified: true,
  },
  {
    nameVi: 'Hạt chia ngâm sữa', nameEn: 'Chia seed pudding', category: 'healthy', region: 'common',
    calPer100g: 88, proteinPer100g: 3.5, carbsPer100g: 10.2, fatPer100g: 4.2, fiberPer100g: 6.8,
    typicalPortionG: 200, verified: true,
    micronutrientsPer100g: { omega3_mg: 1800, calcium_mg: 158, phosphorus_mg: 252 },
  },
];

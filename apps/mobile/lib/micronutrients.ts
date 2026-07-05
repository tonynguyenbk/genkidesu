// Vietnamese labels + display ordering for micronutrients pulled from the verified
// foods DB. Units are derived from the key suffix (_mg → mg, _mcg → µg, _iu → IU,
// _g → g). Unknown keys fall back to a title-cased label so nothing breaks.

const LABELS: Record<string, string> = {
  sodium_mg: 'Natri',
  fiber_g: 'Chất xơ',
  calcium_mg: 'Canxi',
  iron_mg: 'Sắt',
  zinc_mg: 'Kẽm',
  potassium_mg: 'Kali',
  magnesium_mg: 'Magie',
  phosphorus_mg: 'Phốt pho',
  manganese_mg: 'Mangan',
  vitamin_a_mcg: 'Vitamin A',
  vitamin_c_mg: 'Vitamin C',
  vitamin_d_iu: 'Vitamin D',
  vitamin_e_mg: 'Vitamin E',
  vitamin_k_mcg: 'Vitamin K',
  vitamin_b6_mg: 'Vitamin B6',
  vitamin_b12_mcg: 'Vitamin B12',
  vitamin_b3_mg: 'Vitamin B3 (PP)',
  niacin_mg: 'Vitamin PP',
  folate_mcg: 'Folate (B9)',
  omega3_mg: 'Omega-3',
  iodine_mcg: 'I-ốt',
  selenium_mcg: 'Selen',
  choline_mg: 'Choline',
  caffeine_mg: 'Caffeine',
  beta_glucan_g: 'Beta-glucan',
  lycopene_mg: 'Lycopene',
  collagen_mg: 'Collagen',
};

// Display priority — "điểm nóng" (Natri, Chất xơ) first, then minerals, vitamins, rest.
const ORDER: string[] = [
  'sodium_mg', 'fiber_g',
  'calcium_mg', 'iron_mg', 'zinc_mg', 'potassium_mg', 'magnesium_mg', 'phosphorus_mg', 'manganese_mg',
  'vitamin_a_mcg', 'vitamin_c_mg', 'vitamin_d_iu', 'vitamin_e_mg', 'vitamin_k_mcg',
  'vitamin_b6_mg', 'vitamin_b12_mcg', 'vitamin_b3_mg', 'niacin_mg', 'folate_mcg',
  'omega3_mg', 'iodine_mcg', 'selenium_mcg', 'choline_mg',
];

// `protein_mg` is a macro mistakenly living in some micro maps — never show it.
const HIDDEN = new Set(['protein_mg']);

export function microUnit(key: string): string {
  if (key.endsWith('_mcg')) return 'µg';
  if (key.endsWith('_mg')) return 'mg';
  if (key.endsWith('_iu')) return 'IU';
  if (key.endsWith('_g')) return 'g';
  return '';
}

export function microLabel(key: string): string {
  if (LABELS[key]) return LABELS[key]!;
  const base = key.replace(/_(mg|mcg|iu|g)$/, '').replace(/_/g, ' ');
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function formatMicroValue(v: number): string {
  return v >= 10 ? String(Math.round(v)) : v.toFixed(1);
}

export interface MicroRow { key: string; label: string; value: number; unit: string; }

// Turns a micronutrient map into a sorted, displayable list (drops zero/macro keys).
export function formatMicros(micros: Record<string, number> | null | undefined): MicroRow[] {
  if (!micros) return [];
  const rows = Object.entries(micros)
    .filter(([k, v]) => !HIDDEN.has(k) && typeof v === 'number' && v > 0)
    .map(([k, v]) => ({ key: k, label: microLabel(k), value: v, unit: microUnit(k) }));
  rows.sort((a, b) => {
    const ia = ORDER.indexOf(a.key);
    const ib = ORDER.indexOf(b.key);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return rows;
}

// Sums micronutrient maps across multiple dishes/items.
export function sumMicros(
  list: Array<Record<string, number> | null | undefined>,
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const m of list) {
    if (!m) continue;
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === 'number') acc[k] = (acc[k] ?? 0) + v;
    }
  }
  return acc;
}

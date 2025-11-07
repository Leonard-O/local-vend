// Category to unit type mapping configuration
export const CATEGORY_UNIT_MAPPING: Record<string, string[]> = {
  'Vegetables': ['kg', 'g', 'bunch', 'pack', 'piece'],
  'Fruits': ['kg', 'g', 'piece', 'bunch', 'pack'],
  'Dairy': ['litre', 'ml', 'kg', 'g', 'piece', 'pack'],
  'Meat': ['kg', 'g', 'piece', 'pack'],
  'Bakery': ['piece', 'pack', 'box', 'kg', 'g'],
  'Beverages': ['litre', 'ml', 'bottle', 'can', 'pack'],
  'Groceries': ['kg', 'g', 'litre', 'ml', 'pack', 'box', 'piece'],
  'Electronics': ['piece', 'box', 'pack'],
  'Appliances': ['piece', 'box'],
  'Clothing': ['piece', 'pair', 'set'],
  'Other': ['piece', 'pack', 'box', 'kg', 'g', 'litre', 'ml'],
};

export const UNIT_LABELS: Record<string, string> = {
  'kg': 'Kilogram (kg)',
  'g': 'Gram (g)',
  'litre': 'Litre (L)',
  'ml': 'Millilitre (ml)',
  'piece': 'Piece',
  'pack': 'Pack',
  'bunch': 'Bunch',
  'box': 'Box',
  'bottle': 'Bottle',
  'can': 'Can',
  'pair': 'Pair',
  'set': 'Set',
};

export function getUnitsForCategory(category: string): string[] {
  return CATEGORY_UNIT_MAPPING[category] || CATEGORY_UNIT_MAPPING['Other'];
}

export function formatUnitLabel(unit_type: string | null, unit_value: number | null, unit_label?: string | null): string {
  if (unit_label) return unit_label;
  if (!unit_type) return '';
  if (unit_value) return `${unit_value} ${unit_type}`;
  return `per ${unit_type}`;
}

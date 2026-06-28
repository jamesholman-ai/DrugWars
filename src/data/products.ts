import { BUNDLE_ID } from '../constants/appInfo';
import { ProductEffects } from './productEffects';
import {
  ProductCategory,
  ProductDefinition,
  ProductId,
  PackSize,
} from '../types/products';

const STORE_PREFIX = BUNDLE_ID;

function storeSku(id: ProductId): string {
  return `${STORE_PREFIX}.${id}`;
}

function product(
  id: ProductId,
  category: ProductCategory,
  packSize: PackSize,
  title: string,
  priceLabel: string,
  benefits: string[],
  effects: ProductEffects,
  options?: { subtitle?: string; description?: string; bestValue?: boolean }
): ProductDefinition {
  return {
    id,
    category,
    packSize,
    title,
    subtitle: options?.subtitle ?? 'Available Day 1',
    description:
      options?.description ??
      'Fixed consumable pack — optional help, not pay-to-win. No random rewards.',
    priceLabel,
    benefits,
    effects,
    bestValue: options?.bestValue,
    appleProductId: storeSku(id),
    googleProductId: storeSku(id),
  };
}

export const PRODUCTS: ProductDefinition[] = [
  product(
    'starter_boost_small',
    'starter',
    'small',
    'Starter Boost — Small',
    '$0.99',
    ['+$1,500 dirty cash', '−$500 debt', 'Once per run'],
    { dirtyCash: 1500, debtReduction: 500, oncePerRun: true }
  ),
  product(
    'starter_boost_medium',
    'starter',
    'medium',
    'Starter Boost — Medium',
    '$2.99',
    ['+$4,000 dirty cash', '−$1,500 debt', '+1 Intel Tip', 'Once per run'],
    { dirtyCash: 4000, debtReduction: 1500, intelTips: 1, oncePerRun: true },
    { bestValue: true }
  ),
  product(
    'starter_boost_large',
    'starter',
    'large',
    'Starter Boost — Large',
    '$4.99',
    [
      '+$8,000 dirty cash',
      '−$3,000 debt',
      '+2 Intel Tips',
      '+1 Emergency Lawyer token',
      'Once per run',
    ],
    {
      dirtyCash: 8000,
      debtReduction: 3000,
      intelTips: 2,
      lawyerTokens: 1,
      oncePerRun: true,
    },
    { bestValue: true }
  ),

  product(
    'emergency_lawyer_1',
    'legal',
    'small',
    'Emergency Lawyer — 1 Token',
    '$0.99',
    ['1 lawyer token', 'Reduces legal / federal pressure when used', 'Stackable'],
    { lawyerTokens: 1 }
  ),
  product(
    'emergency_lawyer_3',
    'legal',
    'medium',
    'Emergency Lawyer — 3 Tokens',
    '$2.49',
    ['3 lawyer tokens', 'Use during a run for legal relief', 'Stackable'],
    { lawyerTokens: 3 },
    { bestValue: true }
  ),
  product(
    'emergency_lawyer_7',
    'legal',
    'large',
    'Emergency Lawyer — 7 Tokens',
    '$4.99',
    ['7 lawyer tokens', 'Best bulk legal backup', 'Stackable'],
    { lawyerTokens: 7 },
    { bestValue: true }
  ),

  product(
    'intel_pack_3',
    'intel',
    'small',
    'Intel Pack — 3 Tips',
    '$0.99',
    ['3 reveal tokens', 'Reveal hidden market & deal leads', 'Stackable'],
    { intelTips: 3 }
  ),
  product(
    'intel_pack_10',
    'intel',
    'medium',
    'Intel Pack — 10 Tips',
    '$2.49',
    ['10 reveal tokens', 'Reveal hidden opportunities across your run', 'Stackable'],
    { intelTips: 10 },
    { bestValue: true }
  ),
  product(
    'intel_pack_25',
    'intel',
    'large',
    'Intel Pack — 25 Tips',
    '$4.99',
    ['25 reveal tokens', 'Maximum fixed intel bundle', 'Stackable'],
    { intelTips: 25 },
    { bestValue: true }
  ),

  product(
    'safehouse_drop_small',
    'storage',
    'small',
    'Supply Drop — Small',
    '$0.99',
    ['+50 temp storage for 5 days', '−5 heat'],
    { temporaryStorage: { capacity: 50, days: 5 }, heatReduction: 5 }
  ),
  product(
    'safehouse_drop_medium',
    'storage',
    'medium',
    'Supply Drop — Medium',
    '$2.99',
    [
      '+150 temp storage for 7 days',
      '−12 heat',
      '+10 property condition (current city)',
    ],
    {
      temporaryStorage: { capacity: 150, days: 7 },
      heatReduction: 12,
      propertyCondition: 10,
    },
    { bestValue: true }
  ),
  product(
    'safehouse_drop_large',
    'storage',
    'large',
    'Supply Drop — Large',
    '$4.99',
    [
      '+300 temp storage for 10 days',
      '−25 heat',
      '+20 property condition (current city)',
      '+1 robbery protection token',
    ],
    {
      temporaryStorage: { capacity: 300, days: 10 },
      heatReduction: 25,
      propertyCondition: 20,
      robberyProtectionTokens: 1,
    },
    { bestValue: true }
  ),

  product(
    'heat_cleanup_small',
    'heat',
    'small',
    'Heat Cleanup — Small',
    '$0.99',
    ['−10 heat'],
    { heatReduction: 10 }
  ),
  product(
    'heat_cleanup_medium',
    'heat',
    'medium',
    'Heat Cleanup — Medium',
    '$2.99',
    ['−25 heat', '−10 local city heat'],
    { heatReduction: 25, localHeatReduction: 10 },
    { bestValue: true }
  ),
  product(
    'heat_cleanup_large',
    'heat',
    'large',
    'Heat Cleanup — Large',
    '$4.99',
    ['−50 heat', '−25 local city heat', 'Police encounter reduction for 3 days'],
    {
      heatReduction: 50,
      localHeatReduction: 25,
      policeReductionDays: 3,
    },
    { bestValue: true }
  ),

  product(
    'crew_loyalty_small',
    'crew',
    'small',
    'Crew Loyalty — Small',
    '$0.99',
    ['+5 loyalty to all hired crew'],
    { crewLoyalty: 5 }
  ),
  product(
    'crew_loyalty_medium',
    'crew',
    'medium',
    'Crew Loyalty — Medium',
    '$2.99',
    ['+12 loyalty to all hired crew', 'Pays 1 day of crew payroll'],
    { crewLoyalty: 12, payrollDays: 1 },
    { bestValue: true }
  ),
  product(
    'crew_loyalty_large',
    'crew',
    'large',
    'Crew Loyalty — Large',
    '$4.99',
    [
      '+25 loyalty to all hired crew',
      'Pays 3 days of crew payroll',
      'Clears one injured/arrested penalty',
    ],
    { crewLoyalty: 25, payrollDays: 3, clearCrewPenalty: true },
    { bestValue: true }
  ),

  product(
    'business_recovery_small',
    'business',
    'small',
    'Business Recovery — Small',
    '$0.99',
    ['+10 condition to all owned businesses'],
    { businessCondition: 10 }
  ),
  product(
    'business_recovery_medium',
    'business',
    'medium',
    'Business Recovery — Medium',
    '$2.99',
    ['+25 condition to all businesses', 'Pays 1 day of business upkeep'],
    { businessCondition: 25, businessUpkeepDays: 1 },
    { bestValue: true }
  ),
  product(
    'business_recovery_large',
    'business',
    'large',
    'Business Recovery — Large',
    '$4.99',
    [
      '+50 condition to all businesses',
      'Pays 3 days of business upkeep',
      'Business raid protection for 3 days',
    ],
    {
      businessCondition: 50,
      businessUpkeepDays: 3,
      businessRaidProtectionDays: 3,
    },
    { bestValue: true }
  ),
];

export const PRODUCT_MAP: Record<ProductId, ProductDefinition> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p])
) as Record<ProductId, ProductDefinition>;

export const PRODUCT_IDS = PRODUCTS.map((p) => p.id);

export const STORE_CATEGORIES: {
  id: ProductCategory;
  title: string;
  subtitle: string;
}[] = [
  { id: 'starter', title: 'Starter', subtitle: 'Once per run · Day 1' },
  { id: 'legal', title: 'Legal', subtitle: 'Emergency Lawyer tokens' },
  { id: 'intel', title: 'Intel', subtitle: 'Market & deal tips' },
  { id: 'heat', title: 'Heat', subtitle: 'Cool down fast' },
  { id: 'storage', title: 'Storage', subtitle: 'Safehouse supply drops' },
  { id: 'crew', title: 'Crew', subtitle: 'Loyalty & payroll' },
  { id: 'business', title: 'Business', subtitle: 'Front recovery' },
];

export function getProductsByCategory(category: ProductCategory): ProductDefinition[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export const STARTER_BOOST_IDS: ProductId[] = [
  'starter_boost_small',
  'starter_boost_medium',
  'starter_boost_large',
];

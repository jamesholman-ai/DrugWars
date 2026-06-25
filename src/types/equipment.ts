export type EquipmentType = 'weapon' | 'armor' | 'protection';

export interface EquipmentDefinition {
  id: string;
  name: string;
  type: EquipmentType;
  cost: number;
  attackBonus: number;
  defenseBonus: number;
  heatRisk: number;
  /** Max uses before item breaks; undefined = permanent until lost. */
  maxUses?: number;
  description: string;
  /** Short effect line for shop UI. */
  effectText: string;
}

export interface OwnedEquipment {
  equipmentId: string;
  usesRemaining?: number;
}

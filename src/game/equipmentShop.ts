import { GameState } from '../types/game';
import { EQUIPMENT_MAP } from '../data/equipment';
import { OwnedEquipment } from '../types/equipment';
import { withMessage } from './messages';
import { applyProgressionAfterAction } from './progression';
import { clamp } from '../utils/random';

export function purchaseEquipment(
  state: GameState,
  equipmentId: string
): GameState {
  const def = EQUIPMENT_MAP[equipmentId];
  if (!def) {
    return withMessage(state, 'Unknown equipment.');
  }

  if (state.player.cash < def.cost) {
    return withMessage(
      state,
      `Need $${def.cost} for ${def.name}. You have $${state.player.cash}.`
    );
  }

  const owned: OwnedEquipment = {
    equipmentId,
    usesRemaining: def.maxUses,
  };

  const equipment = [...(state.equipment ?? []), owned];

  return applyProgressionAfterAction(
    withMessage(
      {
        ...state,
        player: {
          ...state.player,
          cash: state.player.cash - def.cost,
          heat: clamp(state.player.heat + Math.max(0, def.heatRisk), 0, 100),
        },
        equipment,
      },
      `Purchased ${def.name} (−$${def.cost}). ${def.effectText}`
    )
  );
}

export { EQUIPMENT as listPurchasableEquipment } from '../data/equipment';

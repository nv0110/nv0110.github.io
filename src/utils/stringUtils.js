// Helper: get pitched item state key
export function getPitchedKey(charName, charIdx, bossName, itemName, weekKey) {
  return `${charName}-${charIdx}__${bossName}__${itemName}__${weekKey}`;
} 
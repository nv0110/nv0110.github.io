// Helper: get pitched item state key
export function getPitchedKey(charName, bossName, itemName, weekKey) {
  return `${charName}__${bossName}__${itemName}__${weekKey}`;
} 

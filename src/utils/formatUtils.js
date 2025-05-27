// Format meso values in billions (e.g., 1.1B, 2.5B)
export function formatMesoBillions(meso) {
  if (meso === 0) return "0";
  if (meso < 1000000000) {
    // Less than 1 billion, show in millions with 'M'
    const millions = meso / 1000000;
    if (millions < 1) {
      // Less than 1 million, show in thousands with 'K'
      const thousands = meso / 1000;
      return thousands < 1 ? meso.toString() : `${thousands.toFixed(1)}K`;
    }
    return `${millions.toFixed(1)}M`;
  }
  // 1 billion or more, show in billions with 'B'
  const billions = meso / 1000000000;
  return `${billions.toFixed(1)}B`;
}

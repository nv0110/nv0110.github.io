import { useMemo } from 'react';

// Custom hook for memoized boss calculations
export function useBossCalculations(characters, bossData) {
  // Memoized calculation for character total
  const charTotal = useMemo(() => {
    return (char) => char.bosses.reduce((sum, b) => 
      sum + Math.ceil((b.price || 0) / (b.partySize || 1)), 0
    );
  }, []); // Remove characters dependency as it's not used in the calculation

  // Memoized calculation for overall total
  const overallTotal = useMemo(() => {
    return characters.reduce((sum, c) => sum + charTotal(c), 0);
  }, [characters, charTotal]);

  // Memoized sorted boss data by max price
  const sortedBossData = useMemo(() => {
    return [...bossData].sort((a, b) => {
      const maxPriceA = Math.max(...a.difficulties.map(d => d.price));
      const maxPriceB = Math.max(...b.difficulties.map(d => d.price));
      return maxPriceB - maxPriceA;
    });
  }, [bossData]);

  // Memoized total boss count
  const totalBossCount = useMemo(() => {
    return characters.reduce((sum, c) => sum + (c.bosses?.length || 0), 0);
  }, [characters]);

  // Memoized party size availability checker
  const getAvailablePartySizes = useMemo(() => {
    return (bossName, difficulty) => {
      if (bossName === 'Limbo') {
        return [1, 2, 3];
      }
      if (bossName === 'Lotus' && difficulty === 'Extreme') {
        return [1, 2];
      }
      return [1, 2, 3, 4, 5, 6];
    };
  }, []); // Remove bossData dependency as it's not used in the calculation

  // Memoized boss difficulty getter
  const getBossDifficulties = useMemo(() => {
    return (boss) => boss.difficulties.map(d => d.difficulty);
  }, []); // Remove bossData dependency as it's not used in the calculation

  return {
    charTotal,
    overallTotal,
    sortedBossData,
    totalBossCount,
    getAvailablePartySizes,
    getBossDifficulties,
  };
} 

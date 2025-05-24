import { getCurrentWeekKey } from '../utils/weekUtils';
import { getPitchedKey } from '../utils/stringUtils';
import { removeManyPitchedItems } from '../pitched-data-service';

export function useBossActions({
  characters,
  selectedCharIdx,
  checked,
  setChecked,
  bossData,
  pitchedChecked,
  setPitchedChecked,
  weekKey,
  selectedWeekKey,
  isHistoricalWeek,
  readOnlyOverride,
  userCode,
  userInteractionRef,
  setCrystalAnimation,
  setError,
  startStatsTrackingIfNeeded
}) {
  const currentWeekKey = getCurrentWeekKey();

  const handleCheck = async (bossOrEvent, checkedValOrBoss, event = null) => {
    try {
      if (isHistoricalWeek && !readOnlyOverride) {
        console.log('Boss check blocked - read-only mode active for historical week');
        return;
      }
      
      let boss, checkedVal, e;
      
      if (bossOrEvent && bossOrEvent.name) {
        boss = bossOrEvent;
        checkedVal = checkedValOrBoss;
        e = event;
      } else if (bossOrEvent && bossOrEvent.target) {
        e = bossOrEvent;
        boss = checkedValOrBoss;
        checkedVal = e.target.checked;
      } else {
        console.error('Invalid parameters to handleCheck');
        return;
      }
      
      // Handle animation if this is from a UI click
      if (e && e.clientX && setCrystalAnimation) {
        const startPosition = { x: e.clientX, y: e.clientY };
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
          const progressBarRect = progressBar.getBoundingClientRect();
          const endPosition = {
            x: progressBarRect.left + progressBarRect.width / 2,
            y: progressBarRect.top + progressBarRect.height / 2
          };
          setCrystalAnimation({ startPosition, endPosition });
        }
      }

      const charName = characters[selectedCharIdx]?.name || '';
      const charIdx = selectedCharIdx;
      const charKey = `${charName}-${charIdx}`;
      const bossName = boss.name;
      const bossDifficulty = boss.difficulty;
      const bossKey = `${bossName}-${bossDifficulty}`;
      
      const newChecked = {
        ...checked,
        [charKey]: {
          ...(checked[charKey] || {}),
          [bossKey]: checkedVal
        }
      };

      setChecked(newChecked);
      
      // Save to database for current week only
      if (userCode && selectedWeekKey === currentWeekKey) {
        try {
          const { saveBossRun } = await import('../pitched-data-service');
          const bossRunData = {
            character: charName,
            characterIdx: charIdx,
            bossName: bossName,
            bossDifficulty: bossDifficulty,
            isCleared: checkedVal,
            date: new Date().toISOString()
          };
          
          const result = await saveBossRun(userCode, bossRunData);
          if (!result.success) {
            console.error('Error saving boss run:', result.error);
          }
        } catch (dbError) {
          console.error('Error saving boss state to database:', dbError);
        }
      }
      
      // If boss is being unticked, also untick all pitched items
      if (!checkedVal && selectedWeekKey === currentWeekKey) {
        const bossObj = bossData.find(bd => bd.name === bossName);
        if (bossObj && bossObj.pitchedItems) {
          setPitchedChecked(prev => {
            const updated = { ...prev };
            bossObj.pitchedItems.forEach(item => {
              const key = getPitchedKey(charName, charIdx, bossName, item.name, weekKey);
              if (updated[key]) delete updated[key];
            });
            return updated;
          });
          
          const itemsToRemove = bossObj.pitchedItems.map(item => ({
            character: charName,
            bossName: bossName,
            itemName: item.name,
            weekKey
          }));
          
          if (itemsToRemove.length > 0 && userCode) {
            removeManyPitchedItems(userCode, itemsToRemove).catch(err => {
              console.error('Error removing pitched items:', err);
            });
          }
        }
      }
      
      startStatsTrackingIfNeeded();
    } catch (err) {
      console.error('Error in handleCheck:', err);
      setError('Failed to update boss status. Please try again.');
    }
  };

  const handleTickAll = async () => {
    try {
      if (isHistoricalWeek && !readOnlyOverride) {
        console.log('Tick All blocked - read-only mode active for historical week');
        return;
      }
      
      const char = characters[selectedCharIdx];
      const charBosses = char?.bosses || [];
      const charKey = `${char?.name || ''}-${selectedCharIdx}`;
      const currentState = checked[charKey] || {};
      const allChecked = charBosses.every(b => currentState[b.name + '-' + b.difficulty]);
      const targetState = !allChecked;
      
      userInteractionRef.current = true;
      
      // Update UI state instantly
      const newChecked = {
        ...checked,
        [charKey]: Object.fromEntries(charBosses.map(b => [b.name + '-' + b.difficulty, targetState]))
      };
      setChecked(newChecked);
      
      // Handle pitched items UI state
      if (!targetState) {
        const newPitchedChecked = { ...pitchedChecked };
        charBosses.forEach(boss => {
          const bossObj = bossData.find(bd => bd.name === boss.name);
          if (bossObj?.pitchedItems) {
            bossObj.pitchedItems.forEach(item => {
              const key = getPitchedKey(characters[selectedCharIdx].name, selectedCharIdx, boss.name, item.name, weekKey);
              if (newPitchedChecked[key]) {
                delete newPitchedChecked[key];
              }
            });
          }
        });
        setPitchedChecked(newPitchedChecked);
      }
      
      // Process database operations in background
      if (userCode) {
        const databasePromises = charBosses.map(async (boss, index) => {
          const bossKey = `${boss.name}-${boss.difficulty}`;
          const wasChecked = currentState[bossKey] || false;
          
          if (wasChecked !== targetState) {
            try {
              await new Promise(resolve => setTimeout(resolve, index * 25));
              
              const { saveBossRun } = await import('../pitched-data-service');
              const bossRunData = {
                character: characters[selectedCharIdx].name,
                characterIdx: selectedCharIdx,
                bossName: boss.name,
                bossDifficulty: boss.difficulty,
                isCleared: targetState,
                date: new Date().toISOString()
              };
              
              await saveBossRun(userCode, bossRunData);
            } catch (error) {
              console.error(`Database error for ${boss.name}:`, error);
            }
          }
        });
        
        // Handle pitched items removal if unticking
        if (!targetState) {
          const itemsToRemove = [];
          charBosses.forEach(boss => {
            const bossObj = bossData.find(bd => bd.name === boss.name);
            if (bossObj?.pitchedItems) {
              bossObj.pitchedItems.forEach(item => {
                const key = getPitchedKey(characters[selectedCharIdx].name, selectedCharIdx, boss.name, item.name, weekKey);
                if (pitchedChecked[key]) {
                  itemsToRemove.push({
                    character: characters[selectedCharIdx].name,
                    bossName: boss.name,
                    itemName: item.name,
                    weekKey,
                  });
                }
              });
            }
          });
          
          if (itemsToRemove.length > 0) {
            databasePromises.push(removeManyPitchedItems(userCode, itemsToRemove));
          }
        }
        
        await Promise.allSettled(databasePromises);
      }
      
    } catch (err) {
      console.error('Error in handleTickAll:', err);
      setError('Failed to update all bosses. Please try again.');
    } finally {
      setTimeout(() => {
        userInteractionRef.current = false;
      }, 1000);
    }
  };

  return {
    handleCheck,
    handleTickAll
  };
} 
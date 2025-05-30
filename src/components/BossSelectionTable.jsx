import { getBossPrice } from '../../services/bossRegistryService';
import CustomCheckbox from './CustomCheckbox';
import { LIMITS } from '../constants';
import './BossSelectionTable.css';

function BossSelectionTable({
  selectedCharIdx,
  characterBossSelections,
  sortedBossData,
  getBossDifficulties,
  getAvailablePartySizes,
  onToggleBoss,
  onUpdatePartySize,
  onShowQuickSelect
}) {
  if (selectedCharIdx === null || !characterBossSelections[selectedCharIdx]) {
    return (
      <div className="input-boss-empty-state">
        Select a character to manage their bosses.
      </div>
    );
  }

  return (
    <div className="input-boss-container">
      <div className="input-boss-wrapper">
        {/* Fixed Header Table */}
        <div className="input-boss-header-container">
          <table className="input-boss-table input-boss-header">
            <thead>
              <tr>
                <th className="input-boss-col-boss">
                  Boss
                </th>
                <th className="input-boss-col-difficulty">
                  Difficulty
                </th>
                <th className="input-boss-col-mesos">
                  Mesos
                </th>
                <th className="input-boss-col-controls">
                  <button
                    className="input-boss-quick-select-btn"
                    onClick={onShowQuickSelect}
                    title="Quick Select Bosses"
                  >
                    <svg 
                      className="quick-select-icon" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                    Quick Select
                  </button>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Body Table */}
        <div className="input-boss-body-container">
          <table className="input-boss-table input-boss-body">
            <tbody>
              {sortedBossData.map((boss, bidx) => {
                const difficulties = getBossDifficulties(boss);
                const selected = characterBossSelections[selectedCharIdx]?.bosses.find(b => b.name === boss.name);
                
                return (
                  <tr 
                    key={bidx}
                    className="input-boss-row"
                    onClick={(e) => {
                      // Only trigger if the click wasn't on a form control
                      if (!e.target.closest('select') && !e.target.closest('.checkbox-wrapper') && !e.target.closest('input')) {
                        if (selected) {
                          // Always allow removal
                          onToggleBoss(selectedCharIdx, boss.name, '');
                        } else {
                          // Check 14-boss limit before adding
                          const currentChar = characterBossSelections[selectedCharIdx];
                          const currentBossCount = currentChar?.bosses?.length || 0;
                          
                          if (currentBossCount >= LIMITS.CHARACTER_BOSS_CAP) {
                            // Show error - could enhance this with a callback
                            alert(`Cannot add more than ${LIMITS.CHARACTER_BOSS_CAP} bosses per character.`);
                            return;
                          }
                          
                          onToggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                        }
                      }
                    }}
                  >
                    <td className="input-boss-cell-boss">
                      {boss.image && (
                        <img 
                          src={boss.image} 
                          alt={boss.name} 
                          loading="lazy"
                          className="input-boss-img"
                        />
                      )}
                      <span className="input-boss-name">
                        {boss.name}
                      </span>
                    </td>
                    <td className="input-boss-cell-difficulty">
                      <span className="input-boss-difficulty-text">
                        {selected ? selected.difficulty : ''}
                      </span>
                    </td>
                    <td className="input-boss-cell-mesos">
                      <span className="input-boss-mesos-amount">
                        {selected 
                          ? Math.floor(getBossPrice(boss, selected.difficulty) / (selected.partySize || 1)).toLocaleString()
                          : ''
                        }
                      </span>
                    </td>
                    <td className="input-boss-cell-controls">
                      <div className="input-boss-controls">
                        <CustomCheckbox
                          checked={!!selected}
                          onChange={() => {
                            if (selected) {
                              // Always allow removal
                              onToggleBoss(selectedCharIdx, boss.name, '');
                            } else {
                              // Check 14-boss limit before adding
                              const currentChar = characterBossSelections[selectedCharIdx];
                              const currentBossCount = currentChar?.bosses?.length || 0;
                              
                              if (currentBossCount >= LIMITS.CHARACTER_BOSS_CAP) {
                                // Show error - could enhance this with a callback
                                alert(`Cannot add more than ${LIMITS.CHARACTER_BOSS_CAP} bosses per character.`);
                                return;
                              }
                              
                              onToggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                            }
                          }}
                        />
                        {selected && (
                          <>
                            <select
                              className="input-boss-difficulty-select"
                              value={selected.difficulty}
                              onChange={e => {
                                onToggleBoss(selectedCharIdx, boss.name, e.target.value);
                              }}
                            >
                              {difficulties.map((diff, diffIndex) => (
                                <option key={`${boss.name}-${diff}-${diffIndex}`} value={diff}>{diff}</option>
                              ))}
                            </select>
                            <select
                              className="input-boss-party-select"
                              value={selected.partySize || 1}
                              onChange={e => {
                                onUpdatePartySize(selectedCharIdx, boss.name, selected.difficulty, parseInt(e.target.value));
                              }}
                            >
                              {getAvailablePartySizes(boss.name, selected.difficulty).map((size, sizeIndex) => (
                                <option key={`${boss.name}-${selected.difficulty}-${size}-${sizeIndex}`} value={size}>{size}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BossSelectionTable; 
import { getBossPrice } from '../data/bossData';
import CustomCheckbox from './CustomCheckbox';
import './BossSelectionTable.css';

function BossSelectionTable({
  selectedCharIdx,
  characters,
  sortedBossData,
  getBossDifficulties,
  getAvailablePartySizes,
  onToggleBoss,
  onUpdatePartySize
}) {
  if (selectedCharIdx === null || !characters[selectedCharIdx]) {
    return (
      <div className="boss-selection-empty-state">
        Select a character to manage their bosses.
      </div>
    );
  }

  return (
    <div className="boss-selection-container">
      <div className="table-scroll">
        <table className="boss-selection-table">
          <thead>
            <tr>
              <th className="boss-header">
                Boss
              </th>
              <th className="difficulty-header">
                Difficulty
              </th>
              <th className="mesos-header">
                Mesos
              </th>
              <th className="controls-header">
                {characters[selectedCharIdx]?.name || 'Selected Character'}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBossData.map((boss, bidx) => {
              const difficulties = getBossDifficulties(boss);
              const selected = characters[selectedCharIdx]?.bosses.find(b => b.name === boss.name);
              
              return (
                <tr 
                  key={bidx}
                  onClick={(e) => {
                    // Only trigger if the click wasn't on a form control
                    if (!e.target.closest('select') && !e.target.closest('.checkbox-wrapper') && !e.target.closest('input')) {
                      if (selected) {
                        onToggleBoss(selectedCharIdx, boss.name, '');
                      } else {
                        onToggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                      }
                    }
                  }}
                >
                  <td className="boss-name-cell">
                    {boss.image && (
                      <img 
                        src={boss.image} 
                        alt={boss.name} 
                        loading="lazy"
                        className="boss-image"
                      />
                    )}
                    <span className="boss-name-text">
                      {boss.name}
                    </span>
                  </td>
                  <td className="difficulty-cell">
                    <span className="difficulty-text">
                      {selected ? selected.difficulty : '—'}
                    </span>
                  </td>
                  <td className="mesos-cell">
                    <span className="mesos-amount">
                      {selected 
                        ? Math.floor(getBossPrice(boss, selected.difficulty) / (selected.partySize || 1)).toLocaleString()
                        : '-'
                      }
                    </span>
                  </td>
                  <td className="controls-cell">
                    <div className="controls-container">
                      <CustomCheckbox
                        checked={!!selected}
                        onChange={() => {
                          if (selected) {
                            onToggleBoss(selectedCharIdx, boss.name, '');
                          } else {
                            onToggleBoss(selectedCharIdx, boss.name, difficulties[0]);
                          }
                        }}
                      />
                      {selected && (
                        <>
                          <select
                            className="boss-table-difficulty"
                            value={selected.difficulty}
                            onChange={e => {
                              onToggleBoss(selectedCharIdx, boss.name, e.target.value);
                            }}
                          >
                            {difficulties.map(diff => (
                              <option key={diff} value={diff}>{diff}</option>
                            ))}
                          </select>
                          <select
                            className="party-size-dropdown boss-table-party-size"
                            value={selected.partySize || 1}
                            onChange={e => {
                              onUpdatePartySize(selectedCharIdx, boss.name, selected.difficulty, parseInt(e.target.value));
                            }}
                          >
                            {getAvailablePartySizes(boss.name, selected.difficulty).map(size => (
                              <option key={size} value={size}>{size}</option>
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
  );
}

export default BossSelectionTable; 
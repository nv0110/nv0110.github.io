import { getBossPrice } from '../data/bossData';
import CustomCheckbox from './CustomCheckbox';

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
      <div style={{ 
        padding: '2rem', 
        color: '#888', 
        fontSize: '1.1rem', 
        textAlign: 'center' 
      }}>
        Select a character to manage their bosses.
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem' }}>
      <div className="table-scroll">
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          minWidth: 700, 
          border: '1px solid #2d2540', 
          borderRadius: 12, 
          overflow: 'hidden' 
        }}>
          <thead>
            <tr style={{ background: '#3a2a5d', color: '#e6e0ff' }}>
              <th style={{ 
                padding: '6px 12px', 
                textAlign: 'left', 
                fontWeight: 600, 
                fontSize: '0.9em', 
                minWidth: 70 
              }}>
                Boss
              </th>
              <th style={{ 
                padding: '6px 0px', 
                textAlign: 'left', 
                fontWeight: 600, 
                fontSize: '0.9em', 
                minWidth: 90 
              }}>
                Difficulty
              </th>
              <th className="boss-table-price" style={{ 
                padding: '6px 12px', 
                textAlign: 'center', 
                fontWeight: 600, 
                fontSize: '0.9em', 
                minWidth: 70 
              }}>
                Mesos
              </th>
              <th className="boss-table-controls" style={{ 
                padding: '6px 2px', 
                textAlign: 'center', 
                fontWeight: 600, 
                fontSize: '0.9em', 
                minWidth: 160 
              }}>
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
                  style={{ 
                    background: bidx % 2 === 0 ? '#23203a' : '#201c32', 
                    border: '1px solid #3a335a',
                    color: '#e6e0ff',
                    transition: 'background-color 0.2s ease, transform 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#2a2540'}
                  onMouseOut={e => e.currentTarget.style.background = bidx % 2 === 0 ? '#23203a' : '#201c32'}
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
                  <td style={{ 
                    padding: '8px 2px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    minWidth: 70 
                  }}>
                    {boss.image && (
                      <img 
                        src={boss.image} 
                        alt={boss.name} 
                        loading="lazy"
                        style={{ 
                          width: 40, 
                          height: 40, 
                          objectFit: 'contain', 
                          borderRadius: 6, 
                          background: '#fff1', 
                          marginRight: 8,
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    )}
                    <span className="boss-name" style={{ 
                      fontWeight: 600, 
                      fontSize: '1.05em' 
                    }}>
                      {boss.name}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '8px 2px', 
                    textAlign: 'left', 
                    minWidth: 90 
                  }}>
                    <span style={{ 
                      color: undefined, 
                      fontWeight: 500 
                    }}>
                      {selected ? selected.difficulty : '—'}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '8px 12px', 
                    textAlign: 'center', 
                    minWidth: 70 
                  }}>
                    <span style={{ 
                      color: '#6a11cb', 
                      fontWeight: 600 
                    }}>
                      {selected 
                        ? Math.floor(getBossPrice(boss, selected.difficulty) / (selected.partySize || 1)).toLocaleString()
                        : '-'
                      }
                    </span>
                  </td>
                  <td className="boss-table-controls" style={{ 
                    padding: '8px 2px', 
                    textAlign: 'center', 
                    minWidth: 160, 
                    background: 'inherit', 
                    verticalAlign: 'middle' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6 }}>
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
                            style={{ 
                              marginLeft: 0, 
                              height: 32, 
                              borderRadius: 6, 
                              border: '1px solid #3a335a', 
                              background: '#3a335a', 
                              color: '#e6e0ff', 
                              fontWeight: 600,
                              paddingRight: 18,
                              cursor: 'pointer',
                              minWidth: 90,
                              maxWidth: 120,
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              boxSizing: 'border-box',
                              fontSize: '1rem',
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
                            style={{ 
                              marginLeft: 4, 
                              height: 32, 
                              borderRadius: 6, 
                              border: '1px solid #3a335a', 
                              background: '#3a335a', 
                              color: '#e6e0ff', 
                              fontWeight: 600, 
                              textAlign: 'center',
                              fontSize: '1rem',
                              boxSizing: 'border-box',
                              appearance: 'none',
                              WebkitAppearance: 'none',
                              width: 44,
                              minWidth: 44,
                              padding: '0 10px 0 6px',
                              cursor: 'pointer',
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
import React from 'react';
import CustomCheckbox from './CustomCheckbox';

function BossTable({
  isHistoricalWeek,
  characterBossSelections,
  sortedBosses,
  bossData,
  checked,
  charKey,
  getBossPrice,
  handleCheck,
  context = 'weekly' // Added context prop to distinguish usage
}) {
  // Historical week card layout - Visual structure preserved, functionality removed
  if (isHistoricalWeek) {
    // Get all unique bosses across all characters
    const allBosses = new Map();
    characterBossSelections.forEach(char => {
      char.bosses?.forEach(boss => {
        const bossObj = bossData.find(bd => bd.name === boss.name);
        if (bossObj && bossObj.pitchedItems && bossObj.pitchedItems.length > 0) {
          allBosses.set(boss.name, bossObj);
        }
      });
    });

    return (
      <div className="historical-week-cards-container">
        {Array.from(allBosses.values()).map((bossObj) => (
          <div key={bossObj.name} className="historical-boss-card">
            <div className="historical-boss-header">
              <img
                src={bossObj.image}
                alt={bossObj.name}
                className="historical-boss-image"
              />
              <div className="historical-boss-info">
                <div className="historical-boss-name">{bossObj.name}</div>
              </div>
            </div>

            <div className="historical-pitched-section">
              <div className="historical-pitched-label">Pitched Items</div>
              {(bossObj.pitchedItems || []).length > 0 ? (
                <div className="historical-pitched-grid">
                  {(bossObj.pitchedItems || []).map(item => {
                    // Visual state preserved but no tracking logic
                    const hasPitchedItem = false; // Always false since tracking is disabled

                    return (
                      <div
                        key={item.name}
                        className={`historical-pitched-item ${hasPitchedItem ? 'obtained' : ''}`}
                        title={`${item.name} (tracking disabled)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // No functionality - UI preserved but non-functional
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`historical-pitched-item-image ${hasPitchedItem ? 'obtained' : 'not-obtained'}`}
                        />
                        {hasPitchedItem && (
                          <span className="historical-pitched-checkmark">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="historical-no-pitched">
                  No pitched items available
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Apply context-specific classes to isolate styling
  const contextClasses = {
    wrapper: context === 'weekly' ? 'boss-table-wrapper-weekly' : 'boss-table-wrapper-price',
    headerContainer: context === 'weekly' ? 'boss-table-header-container-weekly' : 'boss-table-header-container-price',
    bodyContainer: context === 'weekly' ? 'boss-table-body-container-weekly' : 'boss-table-body-container-price',
    table: context === 'weekly' ? 'boss-table-weekly' : 'boss-table-price'
  };

  return (
    <div className={contextClasses.wrapper}>
      {/* Fixed Header Table */}
      <div className={contextClasses.headerContainer}>
        <table className={`${contextClasses.table} boss-table-header ${isHistoricalWeek ? 'historical-week' : ''}`}>
          <thead>
            <tr className="boss-table-header-row">
              <th className="boss-table-header-cell">Boss</th>
              <th className="boss-table-header-cell-difficulty">Difficulty</th>
              <th className="boss-table-header-cell-mesos">Mesos</th>
              <th className="boss-table-header-cell-cleared">Cleared</th>
            </tr>
          </thead>
        </table>
      </div>
      
      {/* Scrollable Body Table */}
      <div className={contextClasses.bodyContainer}>
        <table className={`${contextClasses.table} boss-table-body ${isHistoricalWeek ? 'historical-week' : ''}`}>
          <tbody>
          {sortedBosses.map((b, idx) => {
            const bossObj = bossData.find(bd => bd.name === b.name);
            const isChecked = !!checked[charKey]?.[b.name + '-' + b.difficulty];
            const pitched = bossObj?.pitchedItems || [];
            return (
              <tr
                key={b.name + '-' + b.difficulty}
                className={`boss-table-row ${idx % 2 === 0 ? 'even' : 'odd'}`}
                onClick={(e) => {
                  if (!e.target.closest('.checkbox-wrapper') && !e.target.closest('.pitched-item-icon')) {
                    handleCheck(b, !isChecked, e);
                  }
                }}
              >
                <td className="boss-table-cell-boss">
                  {bossObj?.image && (
                    <img
                      src={bossObj.image}
                      alt={b.name}
                      className="boss-table-boss-image"
                    />
                  )}
                  <span className="boss-table-boss-name">{b.name}</span>
                  {pitched.length > 0 && (
                    <div className="boss-table-pitched-container inline">
                      {pitched.map(item => {
                        // Visual structure preserved, functionality removed
                        // Special case for Kalos and Kaling Grindstone - show on all difficulties
                        if ((b.name === 'Watcher Kalos' || b.name === 'Kaling') && item.name === 'Grindstone of Life') {
                          const got = false; // Always false since tracking is disabled
                          return (
                            <span
                              key={item.name}
                              className={`pitched-item-icon inline ${got ? 'obtained' : ''}`}
                              title={`${item.name} (tracking disabled)`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // No functionality - UI preserved but non-functional
                              }}
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className={`pitched-item-image inline ${got ? 'obtained' : 'not-obtained'}`}
                              />
                              {got && (
                                <span className="pitched-item-checkmark inline">✓</span>
                              )}
                            </span>
                          );
                        }

                        // For other items, check difficulty requirements (preserved for visual consistency)
                        if (b.name === 'Lotus') {
                          if (item.name === 'Total Control' && b.difficulty !== 'Extreme') return null;
                          if ((item.name === 'Berserked' || item.name === 'Black Heart') && !['Hard', 'Extreme'].includes(b.difficulty)) return null;
                        }
                        // For Seren, Gravity Module only on Extreme
                        if (b.name === 'Chosen Seren' && item.name === 'Gravity Module' && b.difficulty !== 'Extreme') return null;
                        // For Kalos, Mark of Destruction only on Extreme
                        if (b.name === 'Watcher Kalos' && item.name === 'Mark of Destruction' && b.difficulty !== 'Extreme') return null;
                        // For Kaling, Helmet of Loyalty only on Extreme
                        if (b.name === 'Kaling' && item.name === 'Helmet of Loyalty' && b.difficulty !== 'Extreme') return null;
                        // For all other bosses, only show on Hard or higher
                        if (b.name !== 'Lotus' && b.name !== 'Watcher Kalos' && b.name !== 'Kaling' &&
                            !['Hard', 'Chaos', 'Extreme', 'Hell'].includes(b.difficulty)) return null;

                        const got = false; // Always false since tracking is disabled
                        return (
                          <span
                            key={item.name}
                            className={`pitched-item-icon inline ${got ? 'obtained' : ''}`}
                            title={`${item.name} (tracking disabled)`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // No functionality - UI preserved but non-functional
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className={`pitched-item-image inline ${got ? 'obtained' : 'not-obtained'}`}
                            />
                            {got && (
                              <span className="pitched-item-checkmark inline">✓</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
                <td className="boss-table-cell-difficulty">
                  <span>{b.difficulty}</span>
                </td>
                <td className="boss-table-cell-mesos">
                  <span>{Math.floor(getBossPrice(b.name, b.difficulty) / (b.partySize || 1)).toLocaleString()}</span>
                </td>
                <td className="boss-table-cell-cleared">
                  <span onClick={e => e.stopPropagation()}>
                    <CustomCheckbox
                      checked={isChecked}
                      onChange={e => handleCheck(b, e.target.checked, e)}
                    />
                  </span>
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

export default BossTable; 

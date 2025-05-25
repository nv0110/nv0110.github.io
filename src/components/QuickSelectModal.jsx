import { getBossPrice } from '../data/bossData';

function QuickSelectModal({
  show,
  onClose,
  quickSelectBosses,
  quickSelectError,
  getSortedBossesByPrice,
  getBossDifficulties,
  formatPrice,
  handleQuickSelectBoss,
  applyQuickSelection,
  resetQuickSelection,
  selectedCharIdx,
  characters
}) {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(40,32,74,0.95)',
      zIndex: 4000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(8px)'
    }}
    onClick={onClose}
    >
      <div className="modal-fade" style={{
        background: 'linear-gradient(145deg, #1a1730, #2d2540)',
        borderRadius: 16,
        padding: '2rem',
        maxWidth: 600,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#e6e0ff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 8px 32px rgba(162, 89, 247, 0.15)',
        position: 'relative',
        border: '1px solid rgba(162, 89, 247, 0.2)'
      }}
      onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            color: '#fff',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            outline: 'none',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            borderRadius: 8
          }}
          title="Close"
          onMouseOver={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#ff6b6b';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#fff';
          }}
        >
          ×
        </button>

        <div style={{ 
          width: 80, 
          height: 80, 
          background: 'linear-gradient(135deg, #00d4aa, #01b4cc)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 8px 32px rgba(0, 212, 170, 0.3)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 style={{ color: '#00d4aa', fontWeight: 700, marginBottom: 8, fontSize: '1.8rem', textAlign: 'center' }}>
          Quick Boss Selection
        </h2>

        <p style={{ textAlign: 'center', marginBottom: 24, color: '#b39ddb', fontSize: '1rem' }}>
          Select up to 14 bosses sorted by highest price
        </p>

        {/* Selection Counter */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(1, 180, 204, 0.1))', 
          border: '2px solid rgba(0, 212, 170, 0.3)',
          borderRadius: 12, 
          padding: '16px', 
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#00d4aa', marginBottom: 4 }}>
            {Object.keys(quickSelectBosses).length} / 14
          </div>
          <div style={{ fontSize: '0.9rem', color: '#c4b5d4' }}>
            Bosses Selected
          </div>
        </div>

        {quickSelectError && (
          <div style={{ 
            color: '#ff6b6b', 
            fontSize: '0.9rem',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            {quickSelectError}
          </div>
        )}

        {/* Boss List */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 16, 
            maxHeight: '400px', 
            overflowY: 'auto',
            padding: '8px'
          }}>
            {getSortedBossesByPrice().map((boss, index) => {
              const isSelected = !!quickSelectBosses[boss.name];
              const selectedDifficulty = quickSelectBosses[boss.name];
              const difficulties = getBossDifficulties(boss);
              
              return (
                <div key={boss.name} style={{
                  background: isSelected 
                    ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(1, 180, 204, 0.1))' 
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                  borderRadius: 12,
                  padding: '16px',
                  border: isSelected 
                    ? '2px solid rgba(0, 212, 170, 0.4)' 
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected 
                    ? '0 4px 16px rgba(0, 212, 170, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  {/* Boss Header - Center Aligned */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 12,
                    marginBottom: 16
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#00d4aa',
                      minWidth: '28px',
                      textAlign: 'center'
                    }}>
                      #{index + 1}
                    </div>
                    {boss.image && (
                      <img 
                        src={boss.image} 
                        alt={boss.name} 
                        style={{ 
                          width: 40, 
                          height: 40, 
                          objectFit: 'contain', 
                          borderRadius: 6,
                          background: '#fff1'
                        }}
                      />
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: '1.1rem', color: '#e6e0ff' }}>
                        {boss.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#b39ddb' }}>
                        Max: {formatPrice(boss.maxPrice)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Large Difficulty Buttons - Center Aligned */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    {difficulties.map(difficulty => {
                      const isThisDifficultySelected = selectedDifficulty === difficulty;
                      const price = getBossPrice(boss, difficulty);
                      
                      return (
                        <button
                          key={difficulty}
                          onClick={() => handleQuickSelectBoss(boss.name, difficulty)}
                          style={{
                            background: isThisDifficultySelected 
                              ? 'linear-gradient(135deg, #00d4aa, #01b4cc)' 
                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))',
                            color: isThisDifficultySelected ? '#fff' : '#e6e0ff',
                            border: isThisDifficultySelected 
                              ? '2px solid #00d4aa' 
                              : '2px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: 8,
                            padding: '12px 20px',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            transition: 'all 0.2s ease',
                            minWidth: '120px',
                            minHeight: '50px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            boxShadow: isThisDifficultySelected 
                              ? '0 4px 16px rgba(0, 212, 170, 0.3)' 
                              : '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseOver={e => {
                            if (!isThisDifficultySelected) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(1, 180, 204, 0.1))';
                              e.currentTarget.style.borderColor = 'rgba(0, 212, 170, 0.4)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 212, 170, 0.2)';
                            }
                          }}
                          onMouseOut={e => {
                            if (!isThisDifficultySelected) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.05))';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                        >
                          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{difficulty}</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                            {formatPrice(price)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button
            onClick={resetQuickSelection}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
              color: '#e6e0ff',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              padding: '0.8rem 2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 140
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08))';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Clear All
          </button>
          <button
            onClick={applyQuickSelection}
            disabled={Object.keys(quickSelectBosses).length === 0 || selectedCharIdx === null}
            style={{
              background: Object.keys(quickSelectBosses).length === 0 || selectedCharIdx === null 
                ? 'linear-gradient(135deg, #555, #444)' 
                : 'linear-gradient(135deg, #00d4aa, #01b4cc)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '0.8rem 2rem',
              fontWeight: 700,
              fontSize: '1.1rem',
              cursor: Object.keys(quickSelectBosses).length === 0 || selectedCharIdx === null 
                ? 'not-allowed' 
                : 'pointer',
              opacity: Object.keys(quickSelectBosses).length === 0 || selectedCharIdx === null ? 0.5 : 1,
              minWidth: 140,
              transition: 'all 0.2s ease',
              boxShadow: Object.keys(quickSelectBosses).length > 0 && selectedCharIdx !== null 
                ? '0 4px 16px rgba(0, 212, 170, 0.3)' 
                : 'none'
            }}
            onMouseOver={e => {
              if (Object.keys(quickSelectBosses).length > 0 && selectedCharIdx !== null) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00e6c0, #01c8de)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 212, 170, 0.4)';
              }
            }}
            onMouseOut={e => {
              if (Object.keys(quickSelectBosses).length > 0 && selectedCharIdx !== null) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00d4aa, #01b4cc)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 212, 170, 0.3)';
              }
            }}
          >
            Apply to {selectedCharIdx !== null && characters[selectedCharIdx] ? characters[selectedCharIdx].name : 'Character'}
          </button>
        </div>

        {selectedCharIdx === null && (
          <div style={{ 
            textAlign: 'center', 
            marginTop: 12, 
            fontSize: '0.85rem', 
            color: '#9d8bbc' 
          }}>
            Please select a character first to apply the boss selection
          </div>
        )}
      </div>
    </div>
  );
}

export default QuickSelectModal; 
import React, { useState } from 'react';
import { getCurrentYearKey } from '../utils/weekUtils';

function StatsModal({
  showStats,
  setShowStats,
  allYears,
  selectedYear,
  setSelectedYear,
  yearlyPitchedSummary,
  isLoadingCloudStats,
  setPitchedModalItem,
  setShowPitchedModal,
  setShowStatsResetConfirm
}) {
  if (!showStats) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(40,32,74,0.92)',
      zIndex: 5000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
      onClick={() => setShowStats(false)}
    >
      <div className="modal-fade" style={{ 
        background: '#2d2540', 
        borderRadius: 14, 
        padding: '2.5rem 2rem', 
        maxWidth: 600, 
        color: '#e6e0ff', 
        boxShadow: '0 4px 24px #0006', 
        position: 'relative', 
        minWidth: 320, 
        maxHeight: '90vh', 
        overflowY: 'auto' 
      }} onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setShowStats(false)} 
          style={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            background: 'transparent', 
            color: '#fff', 
            border: 'none', 
            fontSize: '1.5rem', 
            cursor: 'pointer' 
          }} 
          title="Close"
        >
          ×
        </button>
        <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 18, textAlign: 'center' }}>
          Yearly Stats
        </h2>
        
        {/* Year selector dropdown */}
        <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)} 
            style={{ 
              background: '#3a335a', 
              color: '#e6e0ff', 
              border: '1px solid #805ad5', 
              borderRadius: 6, 
              padding: '6px 18px', 
              fontWeight: 600, 
              fontSize: '1.08em', 
              minWidth: 120, 
              textAlign: 'center' 
            }}
          >
            {allYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {yearlyPitchedSummary.length === 0 && (
            <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#b39ddb', textAlign: 'center' }}>
              No pitched items were found for {selectedYear}
            </div>
          )}
        </div>
        
        <div style={{ marginBottom: 8 }}>Pitched Items Obtained:</div>
        
        {isLoadingCloudStats ? (
          <div style={{ textAlign: 'center', padding: '15px', color: '#b39ddb' }}>
            Loading cloud stats...
          </div>
        ) : yearlyPitchedSummary.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#888', fontSize: '1.1rem' }}>
            {/* Empty state */}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8, justifyContent: 'center' }}>
            {yearlyPitchedSummary.map((p, i) => {
              return (
                <span
                  key={i}
                  className="pitched-count-white pitched-hover"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#3a335a',
                    borderRadius: 6,
                    padding: '2px 10px',
                    fontSize: '1em',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 0 8px #805ad5',
                    border: '1px solid #805ad5',
                    transition: 'transform 0.18s cubic-bezier(.4,2,.6,1), box-shadow 0.18s cubic-bezier(.4,2,.6,1)',
                    position: 'relative',
                  }}
                  onClick={() => { setPitchedModalItem(p); setShowPitchedModal(true); }}
                  title={'Click for details'}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.boxShadow = '0 4px 16px #a259f7cc';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 8px #805ad5';
                  }}
                >
                  <img src={p.image} alt={p.name} style={{ width: 22, borderRadius: 4, marginRight: 2, transition: 'box-shadow 0.18s cubic-bezier(.4,2,.6,1)' }} />
                  {p.name}
                  <span className="pitched-count-white" style={{ color: '#fff', marginLeft: 6, fontWeight: 700, fontSize: '1.1em' }}>×{p.count}</span>
                </span>
              );
            })}
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            style={{ 
              background: '#e53e3e', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '0.6rem 1.5rem', 
              fontWeight: 700, 
              fontSize: '1.1rem', 
              cursor: 'pointer' 
            }}
            onClick={() => setShowStatsResetConfirm(true)}
          >
            Reset Stats
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatsModal; 
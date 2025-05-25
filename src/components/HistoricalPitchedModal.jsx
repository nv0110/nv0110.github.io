import { useState, useMemo, useEffect } from 'react';
import { getWeekDateRange } from '../utils/weekUtils'; // Adjusted path

// Historical Pitched Item Modal Component
function HistoricalPitchedModal({ data, characters, onClose, onConfirm }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate the date range for the selected week
  const weekDates = useMemo(() => {
    if (!data.weekKey) return { start: null, end: null };
    return getWeekDateRange(data.weekKey);
  }, [data.weekKey]);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    return date.toISOString().split('T')[0];
  };

  // Get available dates for this week
  const availableDates = useMemo(() => {
    if (!weekDates.start || !weekDates.end) return [];
    
    const dates = [];
    const current = new Date(weekDates.start);
    const end = new Date(weekDates.end);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [weekDates]);

  useEffect(() => {
    // Default to the first day of the week
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(formatDateForInput(availableDates[0]));
    }
    // Default to the first character
    if (characters.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characters[0].name);
    }
  }, [availableDates, selectedDate, characters, selectedCharacter]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedCharacter) return;
    
    setIsLoading(true);
    
    // Create full ISO date string for the selected date
    const fullDate = new Date(selectedDate + 'T12:00:00.000Z').toISOString();
    
    await onConfirm(fullDate, selectedCharacter);
    setIsLoading(false);
  };

  return (
    <div 
      className="modal-fade" 
      style={{
        background: '#2d2540',
        borderRadius: 16,
        padding: '2.5rem',
        maxWidth: 480,
        color: '#e6e0ff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        position: 'relative',
        minWidth: 360,
        textAlign: 'center',
        border: '2px solid #a259f7'
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ 
        width: 80, 
        height: 80, 
        background: 'linear-gradient(135deg, #a259f7, #9f7aea)', 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        margin: '0 auto 24px',
        boxShadow: '0 4px 20px rgba(162, 89, 247, 0.4)'
      }}>
        <img 
          src={data.itemImage} 
          alt={data.itemName}
          style={{
            width: 48,
            height: 48,
            objectFit: 'contain',
            borderRadius: 8
          }}
        />
      </div>
      
      <h2 style={{ color: '#a259f7', fontWeight: 700, marginBottom: 16, fontSize: '1.4rem' }}>
        Log Historical Pitched Item
      </h2>
      
      <div style={{ 
        background: 'rgba(162, 89, 247, 0.1)', 
        border: '1px solid rgba(162, 89, 247, 0.3)',
        borderRadius: 12, 
        padding: '20px', 
        marginBottom: 24,
        textAlign: 'left'
      }}>
        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#b39ddb' }}>Character:</strong> {selectedCharacter || data.character}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#b39ddb' }}>Boss:</strong> {data.bossName}
        </div>
        <div style={{ marginBottom: 12 }}>
          <strong style={{ color: '#b39ddb' }}>Item:</strong> {data.itemName}
        </div>
        <div>
          <strong style={{ color: '#b39ddb' }}>Week:</strong> {data.weekKey}
        </div>
      </div>

      {/* Character Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 8, 
          color: '#b39ddb', 
          fontWeight: 600 
        }}>
          Select Character:
        </label>
        <select
          value={selectedCharacter}
          onChange={e => setSelectedCharacter(e.target.value)}
          style={{
            background: '#3a335a',
            color: '#e6e0ff',
            border: '2px solid #805ad5',
            borderRadius: 8,
            padding: '0.8rem 1rem',
            fontSize: '1rem',
            width: '100%',
            outline: 'none'
          }}
        >
          {characters.map(char => (
            <option key={char.name} value={char.name}>
              {char.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Selection */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 8, 
          color: '#b39ddb', 
          fontWeight: 600 
        }}>
          Select Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          min={weekDates.start ? formatDateForInput(weekDates.start) : ''}
          max={weekDates.end ? formatDateForInput(weekDates.end) : ''}
          style={{
            background: '#3a335a',
            color: '#e6e0ff',
            border: '2px solid #805ad5',
            borderRadius: 8,
            padding: '0.8rem 1rem',
            fontSize: '1rem',
            width: '100%',
            outline: 'none'
          }}
        />
        {weekDates.start && weekDates.end && (
          <div style={{ 
            fontSize: '0.85rem', 
            color: '#9f7aea', 
            marginTop: 8 
          }}>
            Valid range: {formatDateForInput(weekDates.start)} to {formatDateForInput(weekDates.end)}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button
          onClick={onClose}
          disabled={isLoading}
          style={{
            background: '#3a335a',
            color: '#e6e0ff',
            border: '2px solid #4a4370',
            borderRadius: 12,
            padding: '0.8rem 2rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            minWidth: 120,
            transition: 'all 0.2s ease',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading || !selectedDate || !selectedCharacter}
          style={{
            background: isLoading ? '#9f7aea' : 'linear-gradient(135deg, #a259f7, #805ad5)',
            color: '#fff',
            border: '2px solid #a259f7',
            borderRadius: 12,
            padding: '0.8rem 2rem',
            fontWeight: 700,
            fontSize: '1.1rem',
            cursor: isLoading || !selectedDate || !selectedCharacter ? 'not-allowed' : 'pointer',
            opacity: isLoading || !selectedDate || !selectedCharacter ? 0.7 : 1,
            minWidth: 120,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isLoading ? 'none' : '0 4px 16px rgba(162, 89, 247, 0.3)'
          }}
        >
          {isLoading && (
            <div style={{
              width: 16,
              height: 16,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
          {isLoading ? 'Logging...' : 'Log Item'}
        </button>
      </div>

    </div>
  );
}

export default HistoricalPitchedModal; 
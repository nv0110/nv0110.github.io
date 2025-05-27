import { useState, useMemo, useEffect } from 'react';
import { getWeekDateRange } from '../utils/weekUtils'; // Adjusted path
import '../styles/historical-modal.css';

// Historical Pitched Item Modal Component
function HistoricalPitchedModal({ data, characterBossSelections, onClose, onConfirm }) {
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
    if (characterBossSelections.length > 0 && !selectedCharacter) {
      setSelectedCharacter(characterBossSelections[0].name);
    }
  }, [availableDates, selectedDate, characterBossSelections, selectedCharacter]);

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
      className="historical-modal-container"
      onClick={e => e.stopPropagation()}
    >
      {/* Premium Item Header */}
      <div className="historical-modal-header">
        <img 
          src={data.itemImage} 
          alt={data.itemName}
          className="historical-modal-header-image"
        />
      </div>
      
      <h2 className="historical-modal-title">
        Log Historical Pitched Item
      </h2>
      
      <div className="historical-modal-info-box">
        <div className="historical-modal-info-item">
          <span className="historical-modal-info-label">Character:</span> {selectedCharacter || data.character}
        </div>
        <div className="historical-modal-info-item">
          <span className="historical-modal-info-label">Boss:</span> {data.bossName}
        </div>
        <div className="historical-modal-info-item">
          <span className="historical-modal-info-label">Item:</span> {data.itemName}
        </div>
        <div className="historical-modal-info-item">
          <span className="historical-modal-info-label">Week:</span> {data.weekKey}
        </div>
      </div>

      {/* Character Selection */}
      <div className="historical-modal-form-section">
        <label className="historical-modal-label">
          Select Character:
        </label>
        <select
          value={selectedCharacter}
          onChange={e => setSelectedCharacter(e.target.value)}
          className="historical-modal-select"
        >
          {characterBossSelections.map(char => (
            <option key={char.name} value={char.name}>
              {char.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Selection */}
      <div className="historical-modal-form-section">
        <label className="historical-modal-label">
          Select Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          min={weekDates.start ? formatDateForInput(weekDates.start) : ''}
          max={weekDates.end ? formatDateForInput(weekDates.end) : ''}
          className="historical-modal-date-input"
        />
        {weekDates.start && weekDates.end && (
          <div className="historical-modal-helper-text">
            Valid range: {formatDateForInput(weekDates.start)} to {formatDateForInput(weekDates.end)}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="historical-modal-buttons">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="historical-modal-button historical-modal-button-cancel"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading || !selectedDate || !selectedCharacter}
          className="historical-modal-button historical-modal-button-confirm"
        >
          {isLoading && (
            <div className="historical-modal-spinner" />
          )}
          {isLoading ? 'Logging...' : 'Log Item'}
        </button>
      </div>
    </div>
  );
}

export default HistoricalPitchedModal; 
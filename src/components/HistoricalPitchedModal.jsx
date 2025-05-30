import { useState, useMemo, useEffect, useCallback } from 'react';
import { getWeekDateRange } from '../utils/weekUtils'; // Adjusted path
import '../styles/historical-modal.css';

// Historical Pitched Item Modal Component - Simplified for adding items only
function HistoricalPitchedModal({ 
  data, 
  characterBossSelections, 
  onClose, 
  onConfirm,
  pitchedChecked 
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calculate the date range for the selected week
  const weekDates = useMemo(() => {
    if (!data.weekKey) return { start: null, end: null };
    return getWeekDateRange(data.weekKey);
  }, [data.weekKey]);

  // Format date for input field (YYYY-MM-DD)
  const formatDateForInput = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);

  // Get character name from data or default to first character
  const selectedCharacter = useMemo(() => {
    return data.character || characterBossSelections[0]?.name || '';
  }, [data.character, characterBossSelections]);

  useEffect(() => {
    // Default to the first day of the week
    if (weekDates.start && !selectedDate) {
      setSelectedDate(formatDateForInput(weekDates.start));
    }
  }, [weekDates, selectedDate, formatDateForInput]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedCharacter) return;
    
    setIsLoading(true);
    
    // Create full ISO date string for the selected date
    const fullDate = new Date(selectedDate + 'T12:00:00.000Z').toISOString();
    
    await onConfirm(fullDate, selectedCharacter);
    setIsLoading(false);
  };

  const formatWeekDisplay = useMemo(() => {
    if (!weekDates.start || !weekDates.end) return '';
    
    const startMonth = weekDates.start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekDates.end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekDates.start.getDate();
    const endDay = weekDates.end.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  }, [weekDates]);

  return (
    <div 
      className="historical-modal-container-new"
      onClick={e => e.stopPropagation()}
    >
      {/* Premium Item Display */}
      <div className="historical-modal-item-showcase">
        <div className="historical-modal-item-glow-new" />
        <img 
          src={data.itemImage} 
          alt={data.itemName}
          className="historical-modal-item-image-new"
        />
      </div>
      
      <h2 className="historical-modal-title-new">
        Add Historical Drop
      </h2>
      
      <div className="historical-modal-details">
        <div className="historical-modal-detail-row">
          <span className="detail-label">Item:</span>
          <span className="detail-value">{data.itemName}</span>
        </div>
        <div className="historical-modal-detail-row">
          <span className="detail-label">Character:</span>
          <span className="detail-value character-name">{selectedCharacter}</span>
        </div>
        <div className="historical-modal-detail-row">
          <span className="detail-label">Week:</span>
          <span className="detail-value">{formatWeekDisplay}</span>
        </div>
      </div>

      {/* Simple Date Selection */}
      <div className="historical-modal-date-section">
        <label className="historical-modal-date-label">
          Select Drop Date:
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          min={weekDates.start ? formatDateForInput(weekDates.start) : ''}
          max={weekDates.end ? formatDateForInput(weekDates.end) : ''}
          className="historical-modal-date-input-new"
        />
      </div>

      {/* Action Buttons */}
      <div className="historical-modal-actions">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="historical-modal-btn historical-modal-btn-cancel"
        >
          Cancel
        </button>
        
        <button
          onClick={handleConfirm}
          disabled={isLoading || !selectedDate || !selectedCharacter}
          className="historical-modal-btn historical-modal-btn-add"
        >
          {isLoading && <div className="historical-modal-spinner-new" />}
          {isLoading ? 'Adding...' : 'Add Drop'}
        </button>
      </div>
    </div>
  );
}

export default HistoricalPitchedModal; 
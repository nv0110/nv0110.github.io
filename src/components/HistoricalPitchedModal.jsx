import { useState, useMemo, useEffect, useCallback } from 'react';
import { getWeekDateRange } from '../utils/weekUtils';
import { logger } from '../utils/logger';
import '../styles/historical-pitched-modal.css';

// Enhanced Historical Pitched Item Modal Component
function HistoricalPitchedModal({ 
  data, 
  characterBossSelections, 
  onClose, 
  onConfirm,
  pitchedChecked 
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    if (!selectedDate || !selectedCharacter) {
      setError('Please select a valid date and character.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create full ISO date string for the selected date
      const fullDate = new Date(selectedDate + 'T12:00:00.000Z').toISOString();
      
      logger.info('HistoricalPitchedModal: Confirming historical drop', {
        bossName: data.bossName,
        itemName: data.itemName,
        character: selectedCharacter,
        weekKey: data.weekKey,
        date: fullDate
      });
      
      await onConfirm(fullDate, selectedCharacter);
      setIsLoading(false);
    } catch (err) {
      logger.error('HistoricalPitchedModal: Error confirming historical drop', err);
      setError('Failed to add historical drop. Please try again.');
      setIsLoading(false);
    }
  };

  const formatWeekDisplay = useMemo(() => {
    if (!weekDates.start || !weekDates.end) return '';
    
    const startMonth = weekDates.start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekDates.end.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekDates.start.getDate();
    const endDay = weekDates.end.getDate();
    const year = weekDates.start.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }, [weekDates]);

  const getDateOptions = useMemo(() => {
    if (!weekDates.start || !weekDates.end) return [];
    
    const options = [];
    const current = new Date(weekDates.start);
    
    while (current <= weekDates.end) {
      const dateStr = formatDateForInput(current);
      const dayName = current.toLocaleDateString('en-US', { weekday: 'long' });
      const monthDay = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      options.push({
        value: dateStr,
        label: `${dayName}, ${monthDay}`,
        date: new Date(current)
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return options;
  }, [weekDates, formatDateForInput]);

  return (
    <div className="historical-modal-overlay" onClick={onClose}>
      <div 
        className="historical-modal-container"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="historical-modal-header">
          <div className="historical-modal-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20l-7-7h14l-7 7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="historical-modal-title">Add Historical Drop</h2>
          <button className="historical-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Item Showcase */}
        <div className="historical-modal-showcase">
          <div className="historical-modal-item-container">
            <div className="historical-modal-item-glow" />
            <img 
              src={data.itemImage} 
              alt={data.itemName}
              className="historical-modal-item-image"
            />
          </div>
          <div className="historical-modal-item-details">
            <h3 className="historical-modal-item-name">{data.itemName}</h3>
            <p className="historical-modal-boss-name">from {data.bossName}</p>
          </div>
        </div>

        {/* Details Section */}
        <div className="historical-modal-details">
          <div className="historical-modal-detail-group">
            <div className="historical-modal-detail-row">
              <span className="detail-label">Character:</span>
              <span className="detail-value character-name">{selectedCharacter}</span>
            </div>
            <div className="historical-modal-detail-row">
              <span className="detail-label">Week Range:</span>
              <span className="detail-value">{formatWeekDisplay}</span>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="historical-modal-date-section">
          <label className="historical-modal-section-title">
            Select the day you obtained this item:
          </label>
          
          <div className="historical-modal-date-options">
            {getDateOptions.map((option) => (
              <button
                key={option.value}
                className={`historical-modal-date-option ${selectedDate === option.value ? 'selected' : ''}`}
                onClick={() => setSelectedDate(option.value)}
                disabled={isLoading}
              >
                <span className="date-option-day">{option.label.split(',')[0]}</span>
                <span className="date-option-date">{option.label.split(',')[1]}</span>
              </button>
            ))}
          </div>

          {/* Fallback date input for accessibility */}
          <div className="historical-modal-date-input-wrapper">
            <label className="historical-modal-date-input-label">
              Or select date manually:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              min={weekDates.start ? formatDateForInput(weekDates.start) : ''}
              max={weekDates.end ? formatDateForInput(weekDates.end) : ''}
              className="historical-modal-date-input"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="historical-modal-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {error}
          </div>
        )}

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
            className="historical-modal-btn historical-modal-btn-confirm"
          >
            {isLoading && <div className="historical-modal-spinner" />}
            {isLoading ? 'Adding Drop...' : 'Confirm Drop'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistoricalPitchedModal; 
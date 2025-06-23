# Weekly Reset Behavior Documentation

## Overview

This document provides a comprehensive explanation of what happens during weekly resets in the MapleStory Boss Crystal Calculator application. Based on thorough code analysis and testing simulations, this covers the behavior of `user_boss_data.weekly_clears`, `user_data.pitched_items`, the WeeklyTracker page, and historical week cap functionality.

---

## 🔄 Weekly Reset Process

### When Weekly Reset Occurs
- **Timing**: Every Thursday at 00:00 UTC (following MapleStory's official weekly reset schedule)
- **Trigger**: Automatic detection when the application detects a week change
- **Configuration**: Defined in `src/constants.js` as `WEEKLY_RESET_INFO`

```javascript
export const WEEKLY_RESET_INFO = {
  DAY: 4, // Thursday (0 = Sunday, 4 = Thursday)
  HOUR: 0, // 00:00 UTC
  TIMEZONE: 'UTC',
};
```

### Reset Detection Logic
The weekly reset is detected and handled in multiple places:

1. **App.jsx**: Main application level reset handler
2. **useAppData.js**: Performs the core reset actions
3. **WeeklyTracker.jsx**: UI refresh on reset detection

---

## 📊 Data Behavior During Weekly Reset

### 1. user_boss_data.weekly_clears

**What Happens:**
- ✅ **CLEARED** for the current week (new week)
- ✅ **PRESERVED** for all historical weeks
- ✅ Character mappings (`char_map`) remain intact
- ✅ Boss configurations (`boss_config`) remain intact

**Technical Implementation:**
```javascript
// In useAppData.js performWeeklyResetActions()
await saveCurrentWeekData(userCode, {
  weekly_clears: {} // Clear all weekly clears for new week
});
```

**Result:**
- Current week starts with empty boss clears (`{}`)
- Historical weeks retain all previous boss clear data
- Users can immediately start tracking bosses for the new week
- Historical data remains accessible for statistics and review

**Example:**
```javascript
// Before Reset
user_boss_data: {
  weekly_clears: {
    "0": "ZK-N,PB-N,HT-N", // Character 0 cleared 3 bosses
    "1": "ZK-N,VL-N"       // Character 1 cleared 2 bosses
  }
}

// After Reset (new week)
user_boss_data: {
  weekly_clears: {} // Completely cleared for new week
}

// Historical week data remains unchanged
previous_week_data: {
  weekly_clears: {
    "0": "ZK-N,PB-N,HT-N", // Still preserved
    "1": "ZK-N,VL-N"       // Still preserved
  }
}
```

### 2. user_data.pitched_items

**What Happens:**
- ✅ **NEVER AFFECTED** by weekly resets
- ✅ Remain as **permanent historical data**
- ✅ Automatically become "historical" when current week changes
- ✅ Available for viewing across all weeks

**Design Philosophy:**
Pitched items represent valuable drops that users want to track long-term. Weekly resets should not affect this historical tracking data.

**Technical Implementation:**
```javascript
// In App.jsx handleWeeklyReset()
// 2. REMOVED: Do NOT clear pitched items - they should remain as historical data
// Pitched items automatically become "historical" when the current week changes
```

**Result:**
- All pitched items from previous weeks remain intact
- Users can view pitched items for any historical week
- Statistical analysis includes all historical pitched data
- No data loss occurs during weekly resets

**Example:**
```javascript
// Before AND After Reset - No Change
user_data.pitched_items: [
  {
    "charId": "TestChar1",
    "bossName": "Zakum",
    "item": "Condensed Power Crystal",
    "date": "2024-12-19" // Previous week
  },
  {
    "charId": "TestChar1", 
    "bossName": "Papulatus",
    "item": "Black Cube",
    "date": "2024-12-26" // Current week
  }
]
// All items preserved regardless of weekly reset
```

---

## 🎮 WeeklyTracker Page Behavior

### During Weekly Reset

**UI Changes:**
1. **Boss Checkboxes**: All cleared for current week
2. **Character Data**: Preserved and accessible
3. **Week Navigation**: Maintains functionality
4. **Pitched Items**: Continue to display correctly

**Implementation Details:**

```javascript
// In WeeklyTracker.jsx
useEffect(() => {
  if (lastWeeklyResetTimestamp > 0 && userCode) {
    logger.debug('WeeklyTracker: Detected weekly reset, refreshing pitched items.');
    const timeoutId = setTimeout(() => {
      refreshPitchedItems();
    }, 500);
    return () => clearTimeout(timeoutId);
  }
}, [lastWeeklyResetTimestamp, userCode, refreshPitchedItems]);
```

### Week Navigation Impact

**Current Week (Post-Reset):**
- Shows empty boss clear checkboxes
- Allows immediate tracking for new week
- Character configurations remain intact
- Pitched items interface remains functional

**Historical Weeks:**
- Preserve all boss clear data
- Show historical pitched items correctly
- Maintain week-specific statistics
- Allow review of past performance

**Navigation Features:**
- Seamless switching between current and historical weeks
- Week offset calculations remain accurate
- Data integrity maintained across navigation
- No performance impact from reset

---

## 📈 Historical Week Cap Behavior

### Adaptive Week Limit System

The application uses an adaptive system for determining how many historical weeks to show:

**User Classification:**
```javascript
// In utilityService.js getHistoricalWeekAnalysis()
const hasHistoricalData = historicalWeeksList.length > 0;
let userType = 'new';
let adaptiveWeekLimit = 8; // Default 8-week limit

if (hasHistoricalData) {
  const weeksOfHistory = Math.abs(oldestOffset);
  if (weeksOfHistory > 8) {
    userType = 'existing';
    adaptiveWeekLimit = weeksOfHistory;
  }
}
```

**Behavior:**
- **New Users**: 8-week limit (default)
- **Existing Users**: Adaptive limit based on actual historical data
- **Large Datasets**: Efficiently handled without performance degradation

### Historical Data Preservation

**During Weekly Reset:**
- Historical week cap calculations are unaffected
- All historical data remains accessible
- Week navigation performance is maintained
- User type classification remains accurate

**Long-term Behavior:**
- Historical data grows over time
- Week cap adapts to accommodate user's actual usage
- No arbitrary data deletion occurs
- Performance remains optimal with large datasets

---

## 🧪 Test Coverage and Validation

### Comprehensive Test Scenarios

The application includes extensive test coverage for weekly reset behavior:

**1. Basic Weekly Reset Test (`test-weekly-reset-simulation.js`)**
- Validates `weekly_clears` behavior
- Confirms `pitched_items` preservation
- Tests multi-character scenarios
- Verifies data integrity

**2. UI Component Tests (`test-weekly-tracker-ui.test.js`)**
- Tests WeeklyTracker component behavior
- Validates responsive design across devices
- Ensures accessibility compliance
- Tests error handling and edge cases

**3. Performance Tests**
- Large dataset handling
- Frequent state updates
- Memory usage optimization
- Render time validation

### Test Results Summary

✅ **All tests validate that weekly resets:**
- Clear only current week boss clears
- Preserve all historical data
- Maintain UI functionality
- Handle edge cases gracefully
- Perform efficiently at scale

---

## 🔧 Technical Implementation Details

### Core Services Involved

**1. userWeeklyDataService.js**
- Manages `user_boss_data` table operations
- Handles `weekly_clears` clearing and preservation
- Maintains character mappings and boss configurations

**2. pitchedItemsService.js**
- Manages `user_data.pitched_items` array
- Provides filtering by week/date
- Maintains historical data integrity

**3. utilityService.js**
- Provides historical week analysis
- Manages adaptive week limits
- Handles data cleanup and migration

### Database Schema Impact

**user_boss_data Table:**
```sql
CREATE TABLE user_boss_data (
  user_id TEXT NOT NULL,
  maple_week_start DATE NOT NULL,
  char_map JSONB,          -- Preserved during reset
  boss_config JSONB,       -- Preserved during reset  
  weekly_clears JSONB,     -- CLEARED for new week
  PRIMARY KEY (user_id, maple_week_start)
);
```

**user_data Table:**
```sql
CREATE TABLE user_data (
  id TEXT PRIMARY KEY,
  data JSONB,
  pitched_items JSONB     -- NEVER affected by weekly reset
);
```

### Reset Sequence

1. **Detection**: App detects week change
2. **UI Clear**: Clear boss checkboxes (`setChecked({})`)
3. **Database Update**: Clear `weekly_clears` for current week
4. **Preservation**: Historical weeks remain untouched
5. **UI Refresh**: Update components to reflect new state
6. **Validation**: Confirm reset completed successfully

---

## 🚨 Important Considerations

### Data Safety
- **No Data Loss**: Weekly resets never delete historical data
- **Selective Clearing**: Only current week boss clears are affected
- **Backup Preservation**: Historical weeks provide automatic backup
- **Error Recovery**: Failed resets don't corrupt existing data

### User Experience
- **Immediate Availability**: New week tracking available instantly
- **Historical Access**: Past data remains accessible
- **Performance**: No impact on application speed
- **Consistency**: Behavior is predictable and reliable

### Edge Cases Handled
- **Multi-character setups**: All characters reset simultaneously
- **Network interruptions**: Reset process is fault-tolerant
- **Browser crashes**: Data integrity maintained
- **Timezone issues**: UTC-based timing prevents confusion

---

## 📝 Conclusion

The weekly reset system in the MapleStory Boss Crystal Calculator is designed with data preservation and user experience as primary concerns. The system ensures that:

1. **Boss tracking resets appropriately** for the new week
2. **Historical data is never lost** during resets
3. **Pitched items remain permanently available** for long-term tracking
4. **UI remains responsive and functional** throughout the process
5. **Performance is maintained** regardless of data volume

This design allows users to track their weekly progress while maintaining a complete historical record of their MapleStory boss clearing and item pitching activities.

---

## 🔗 Related Files

- `/test-weekly-reset-simulation.js` - Comprehensive reset simulation
- `/test-weekly-tracker-ui.test.js` - UI component testing
- `/src/App.jsx` - Main reset handler
- `/src/hooks/useAppData.js` - Core reset logic
- `/src/WeeklyTracker.jsx` - UI refresh handling
- `/services/userWeeklyDataService.js` - Database operations
- `/services/pitchedItemsService.js` - Pitched items management
- `/services/utilityService.js` - Historical analysis
- `/src/constants.js` - Reset timing configuration 
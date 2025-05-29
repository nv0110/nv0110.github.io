# Phase 1 Refactor Summary: Authentication & Weekly Character Configuration

## Overview

This document summarizes the comprehensive refactor of the application's data management systems, focusing on Phase 1 which covers Authentication and Weekly Character Configuration Management. The refactor transitions from the legacy fragmented system to a consolidated, maintainable architecture targeting the new Supabase database schema.

## Objectives Achieved

### 1. Code Consolidation & Organization ✅
- **Problem**: Previously fragmented logic across multiple files (`src/hooks/useAuth.js`, `src/hooks/useAppData.js`, various components)
- **Solution**: Consolidated into fewer, cohesive modules with clear responsibilities
- **Result**: Reduced complexity and improved maintainability

### 2. New Database Schema Implementation ✅
- **Transition**: From legacy `user_data.data` JSONB structure to new structured tables
- **Target Tables**: `user_data` (refined role), `user_boss_data`, `boss_registry`
- **Benefit**: Better data integrity, performance, and scalability

## New File Structure

### Services Layer (Business Logic)
```
services/
├── authenticationService.js     # All authentication operations
└── userWeeklyDataService.js     # Weekly character/boss configuration
```

### Hooks Layer (React Integration)
```
hooks/
├── useAuthentication.js         # Authentication state management
└── useUserWeeklyData.js         # Weekly data state management
```

### Utilities Layer (Helper Functions)
```
utils/
└── mapleWeekUtils.js           # Maple Story week calculations and utilities
```

## Architectural Decisions & Justifications

### 1. Service-Hook Pattern
**Decision**: Separate pure business logic (services) from React state management (hooks)
**Justification**: 
- Services can be tested independently
- Hooks provide React-specific state management
- Clear separation of concerns
- Services are reusable across different UI frameworks if needed

### 2. Consolidated Files vs. Micro-modules
**Decision**: Group related functionality into cohesive modules rather than splitting into many small files
**Justification**:
- Reduces cognitive overhead when navigating codebase
- Related functions stay together (e.g., all character operations in one place)
- Easier to understand data flow
- Follows the principle of high cohesion, low coupling

### 3. Error Handling Strategy
**Decision**: Consistent error handling with `{success: boolean, error?: string}` pattern
**Justification**:
- Predictable error handling across all service functions
- Easy to chain operations and handle failures gracefully
- Consistent with existing application patterns

## New Database Schema Integration

### user_data Table (Refined Role)
```sql
- id (TEXT, Primary Key): User's unique login code
- data (JSONB): Minimal use for user-level settings
- pitched_items (JSONB): Array of pitched item objects (preserved)
```

### user_boss_data Table (New - Primary Weekly Data)
```sql
- user_id (TEXT, Foreign Key)
- maple_week_start (DATE, 'YYYY-MM-DD' format)
- char_map (JSONB): Maps index to character names
- boss_config (JSONB): Maps character index to boss configurations
- weekly_clears (JSONB): Maps character index to cleared boss codes
- created_at (TIMESTAMPZ)
```

### boss_registry Table (New - Static Boss Information)
```sql
- id (TEXT, Primary Key): Boss difficulty identifier
- boss_code (TEXT): Short boss code
- boss_name (TEXT): Full boss name
- difficulty (TEXT): Difficulty level
- crystal_value (INTEGER): Meso value
- max_party_size (INTEGER): Maximum party size
- enabled (BOOLEAN): Availability status
```

## Key Features Implemented

### Authentication Service (`services/authenticationService.js`)
- `createAccount()`: Creates new user with unique ID
- `loginUser(userId)`: Validates user login
- `deleteUserAccount(userId)`: Cascading delete (user_boss_data + user_data)

### User Weekly Data Service (`services/userWeeklyDataService.js`)
- `fetchUserWeeklyData()`: Get weekly data for specific user/week
- `saveOrUpdateUserWeeklyData()`: Upsert weekly data
- `addCharacterToWeeklySetup()`: Add character with automatic index assignment
- `removeCharacterFromWeeklySetup()`: Remove character (allows index gaps)
- `updateCharacterNameInWeeklySetup()`: Update character name with validation
- `updateCharacterBossConfigInWeeklySetup()`: Update boss configuration with validation

### Maple Week Utilities (`utils/mapleWeekUtils.js`)
- `getCurrentMapleWeekStartDate()`: Calculate current week start (Thursday 00:00 UTC)
- `getMapleWeekStartDateWithOffset()`: Calculate week starts with offsets
- `parseBossConfigString()` / `constructBossConfigString()`: Boss config string handling
- `isValidMapleWeekStart()`: Validate week start dates

### React Hooks (`hooks/useAuthentication.js`, `hooks/useUserWeeklyData.js`)
- State management for UI components
- Integration with services layer
- Consistent with existing application patterns

## Data Flow Pattern

```
UI Components
    ↓
React Hooks (state management)
    ↓
Services (business logic)
    ↓
Supabase Client
    ↓
Database (new schema)
```

## Migration Strategy

### Character Index Handling
**Decision**: Allow gaps in character indices when characters are removed
**Justification**:
- Preserves historical data integrity
- Simpler logic than renumbering
- Avoids potential data corruption during concurrent operations

### Boss Configuration Format
**Format**: `"boss_code:crystal_value:party_size,boss_code:crystal_value:party_size,..."`
**Example**: `"DH:421875000:1,LH:444675000:1"`
**Validation**: Against `boss_registry` table for code validity, crystal values, and party size limits

## Compatibility & Transition

### Backwards Compatibility
- New hooks provide same interface as legacy hooks where possible
- Gradual migration path - old and new systems can coexist temporarily
- Error handling maintains existing patterns

### Phase 1 Scope Limitations (By Design)
- ❌ No implementation of `weekly_clears` tracking (Phase 2)
- ❌ No new `pitched_items` addition logic (Phase 2)
- ❌ No CSS/UI changes (focus on backend logic)
- ❌ No data migration from legacy `user_data.data` structures

## Next Steps for Phase 2

1. **Weekly Clears Tracking**: Implement logic to mark bosses as cleared
2. **Pitched Items Management**: New system for adding pitched items
3. **Data Migration**: Tools to migrate legacy data to new schema
4. **UI Updates**: Adapt frontend components to use new hooks
5. **Performance Optimization**: Implement caching and batch operations

## File Dependencies

### New Dependencies Added
- `services/authenticationService.js` → `src/supabaseClient.js`
- `services/userWeeklyDataService.js` → `src/supabaseClient.js`, `utils/mapleWeekUtils.js`
- `hooks/useAuthentication.js` → `services/authenticationService.js`, `src/constants.js`
- `hooks/useUserWeeklyData.js` → `services/userWeeklyDataService.js`, `hooks/useAuthentication.js`

### Legacy Files to Eventually Replace
- `src/hooks/useAuth.js` → `hooks/useAuthentication.js`
- `src/hooks/useAppData.js` → `hooks/useUserWeeklyData.js` (partial)
- Parts of `src/pages/InputPage.jsx` → New service functions

## Testing Recommendations

1. **Unit Tests**: Service functions with mocked Supabase client
2. **Integration Tests**: End-to-end data flow from hooks to database
3. **Error Handling Tests**: Network failures, invalid data, edge cases
4. **Migration Tests**: Legacy data compatibility and conversion

## Performance Considerations

1. **Upsert Operations**: Efficient handling of existing vs. new records
2. **Batch Operations**: For multiple character operations
3. **Caching Strategy**: Consider caching current week data
4. **Index Optimization**: Database indices on frequently queried fields

This refactor provides a solid foundation for the application's data management systems while maintaining compatibility with existing functionality.
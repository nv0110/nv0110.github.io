# MapleStory Boss Crystal Calculator

A React application for calculating weekly boss crystal values in MapleStory, now with multi-page navigation using React Router.

## Features

- **Multi-page Navigation**: Navigate between different sections using React Router
- **Character Management**: Create and manage multiple characters
- **Boss Selection**: Select bosses and difficulties for each character
- **Weekly Tracking**: Track weekly boss completions and pitched items
- **Boss Price Table**: View current boss crystal prices
- **Data Backup/Restore**: Export and import your character data
- **Cloud Sync**: Save data to cloud with user accounts

## Pages

- **`/`** - Main calculator page (character creation and boss selection)
- **`/weeklytracker`** - Weekly boss completion tracker
- **`/bosstable`** - Boss price reference table
- **`/login`** - User authentication

## Getting Started

1. Install dependencies:
```bash
   npm install
   ```

2. Start the development server:
```bash
   npm run dev
   ```

3. Build for production:
```bash
   npm run build
   ```

## Navigation

The app uses React Router for client-side routing. All routes are protected and require user authentication except for the login page.

## Technology Stack

- React 19.1.0
- React Router DOM 7.6.0
- Vite (build tool)
- Supabase (backend/database)
- CSS-in-JS styling

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Navigation bar
│   ├── WeekNavigator.jsx
│   ├── Tooltip.jsx
│   └── DataBackup.jsx
├── pages/              # Route components
│   ├── LoginPage.jsx   # Authentication page
│   ├── InputPage.jsx   # Main calculator
│   ├── BossTablePage.jsx
│   └── WeeklyTrackerPage.jsx
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Authentication logic
│   ├── useAppData.js   # Shared state management
│   └── useLocalStorage.js
├── data/               # Static data
│   └── bossData.js     # Boss information and prices
├── utils/              # Utility functions
└── types/              # Type definitions
```

## State Management

The app uses a centralized state management approach with the `useAppData` hook, which provides:
- Character data management
- Boss selection and calculations
- Import/export functionality
- Undo/redo operations
- Data persistence

## Authentication

Users can create accounts and log in to save their data to the cloud. All routes except `/login` are protected and require authentication.

## 🔧 Development & Debugging

### Debug Mode
The application uses intelligent logging that's silent in production but can be enabled for debugging:

```javascript
// Enable debug logging (shows all logs)
localStorage.setItem('debug', 'true');
window.location.reload();

// Disable debug logging  
localStorage.removeItem('debug');
window.location.reload();
```

### Log Levels
- **Production**: Silent (no console logs)
- **Development**: Important info and errors only
- **Debug Mode**: All logs including user actions and debug info

## 🎮 MapleStory Boss Crystal Calculator

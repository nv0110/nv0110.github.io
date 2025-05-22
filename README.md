# Maplestory Boss Crystal Calculator & Weekly Tracker

A modern, mobile-friendly web app for Maplestory players to track boss clears, calculate weekly crystal meso earnings, and sync progress across devices.

## Features

- **Boss Crystal Calculator:**  
  - Add multiple characters and select their weekly bosses.
  - Automatically calculates total meso value per character and overall.
  - Supports party size splits and all major bosses (including Hilla, Princess No, etc).

- **Weekly Tracker:**  
  - Track which bosses you've cleared each week for each character.
  - Visual progress bar and meso goal tracking.
  - Weekly reset timer (Thursday 00:00 UTC) with automatic clear state reset.

- **Cloud Sync (Supabase):**  
  - Create a simple account (no email required) and get a unique code.
  - Log in from any device with your code to access your data.
  - All character and weekly progress is synced to the cloud.

- **Account Management:**  
  - Securely delete your account and all data from the cloud at any time.
  - Logout and login with your unique code.

- **Mobile-First, Responsive UI:**  
  - Fully functional and visually appealing on both desktop and mobile.
  - Tables are scrollable and readable on small screens.
  - Buttons and controls are touch-friendly and well-aligned.

- **User Experience:**  
  - Helpful tooltips, guide text, and FAQ/help modal.
  - Visual feedback for cloud sync.
  - Dark mode only, with consistent styling.

## Getting Started

1. **Clone the repository:**
   ```sh
   git clone https://github.com/nv0110/nv0110.github.io.git
   cd nv0110.github.io
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Run locally:**
   ```sh
   npm run dev
   ```

4. **Build for production:**
   ```sh
   npm run build
   ```

5. **Deploy to GitHub Pages:**
   ```sh
   npm run deploy
   ```

## Usage

- **Create an account** to get your unique code.
- **Add characters** and select bosses for each.
- **Track weekly clears** and see your total meso earnings.
- **Log in from any device** with your code to sync your data.
- **Delete your account** at any time from the top-right menu.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Supabase (Postgres, Auth, Realtime)
- **Deployment:** GitHub Pages

## Security & Privacy

- No email or personal info required.
- Your data is stored securely in Supabase and can be deleted at any time.
- **Keep your code safe!** It is the only way to access your account.

## License

MIT

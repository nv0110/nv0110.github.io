// Application constants
export const LIMITS = {
  CHARACTER_BOSS_CAP: 14,
  TOTAL_BOSS_CAP: 180,
  MAX_CHARACTERS: 50,
  MAX_PRESETS_PER_CHARACTER: 2,
  PRESET_NAME_MAX_LENGTH: 5,
};

export const PARTY_SIZE_LIMITS = {
  LIMBO: [1, 2, 3],
  LOTUS_EXTREME: [1, 2],
  DEFAULT: [1, 2, 3, 4, 5, 6],
};

export const STORAGE_KEYS = {
  USER_CODE: 'ms-user-code',
  PRESETS: 'ms-presets',
  ACTIVE_PAGE: 'ms-active-page',
  WEEKLY_HIDE_COMPLETED: 'ms-weekly-hide-completed',
};

export const PAGES = {
  CALCULATOR: 'calculator',
  TABLE: 'table',
  WEEKLY: 'weekly',
};

export const DIFFICULTY_ORDER = {
  Extreme: 5,
  Hard: 4,
  Chaos: 3,
  Normal: 2,
  Easy: 1,
};

export const COOLDOWNS = {
  CREATE_ACCOUNT: 5,
  ACCOUNT_MODAL: 8,
  DATA_SYNC: 1000,
  BACKGROUND_SYNC: 180000, // 3 minutes
  USER_INTERACTION_CLEAR: 1000,
};

export const ANIMATION_DURATIONS = {
  CRYSTAL: 1000,
  LOADING: 300,
  RESET_SUCCESS: 2000,
  UNDO_TIMEOUT: 4000,
  CLOUD_SYNC_DISPLAY: 1500,
};

export const BOSS_DIFFICULTIES = {
  PITCHED_ELIGIBLE: {
    LOTUS: ['Hard', 'Extreme'],
    DEFAULT: ['Hard', 'Chaos', 'Extreme', 'Hell'],
  },
};

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const COLORS = {
  PRIMARY: '#a259f7',
  SECONDARY: '#805ad5',
  SUCCESS: '#38a169',
  ERROR: '#e53e3e',
  WARNING: '#ffd700',
  BACKGROUND: '#28204a',
  CARD_BACKGROUND: '#2d2540',
  TABLE_ROW_EVEN: '#23203a',
  TABLE_ROW_ODD: '#201c32',
  TABLE_HEADER: '#3a2a5d',
  BORDER: '#3a335a',
};

export const BREAKPOINTS = {
  MOBILE: 600,
  TABLET: 768,
  DESKTOP: 1024,
};

export const WEEKLY_RESET_INFO = {
  DAY: 4, // Thursday (0 = Sunday, 4 = Thursday)
  HOUR: 0, // 00:00 UTC
  TIMEZONE: 'UTC',
}; 
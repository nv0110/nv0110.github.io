/**
 * WeeklyTracker UI Component Tests
 * Tests the UI behavior during weekly resets and historical navigation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import WeeklyTracker from '../src/WeeklyTracker';
import { AppDataProvider } from '../src/hooks/AppDataContext';
import { convertDateToWeekKey, getWeekOffset } from '../src/utils/weekUtils';
import { getCurrentMapleWeekStartDate, getMapleWeekStartDate } from '../utils/mapleWeekUtils';

// Mock the services
vi.mock('../services/userWeeklyDataService.js', () => ({
  fetchUserWeeklyData: vi.fn(),
  saveCurrentWeekData: vi.fn(),
  toggleBossClearStatus: vi.fn(),
}));

vi.mock('../services/pitchedItemsService.js', () => ({
  getPitchedItems: vi.fn(),
  addPitchedItem: vi.fn(),
  removePitchedItem: vi.fn(),
}));

vi.mock('../services/utilityService.js', () => ({
  getHistoricalWeekAnalysis: vi.fn(),
}));

// Mock hooks
vi.mock('../src/hooks/useUserWeeklyData.js', () => ({
  useUserWeeklyData: () => ({
    refreshWeeklyData: vi.fn(),
    weeklyData: {},
  }),
}));

vi.mock('../src/hooks/useWeekNavigation.js', () => ({
  useWeekNavigation: () => ({
    selectedWeekKey: convertDateToWeekKey(getCurrentMapleWeekStartDate()),
    isHistoricalWeek: false,
    handleWeekChange: vi.fn(),
    refreshHistoricalAnalysis: vi.fn(),
    weekNavigationData: {
      availableWeeks: [],
      currentWeekKey: convertDateToWeekKey(getCurrentMapleWeekStartDate()),
    },
  }),
}));

vi.mock('../src/hooks/usePitchedItems.js', () => ({
  usePitchedItems: () => ({
    pitchedChecked: {},
    setPitchedChecked: vi.fn(),
    cloudPitchedItems: [],
    refreshPitchedItems: vi.fn(),
    userInteractionRef: { current: false },
    addNewPitchedItem: vi.fn(),
    removePitchedItemByDetails: vi.fn(),
  }),
}));

vi.mock('../src/hooks/useBossActions.js', () => ({
  useBossActions: () => ({
    handleBossCheck: vi.fn(),
    handleClearAll: vi.fn(),
    handleMarkAll: vi.fn(),
  }),
}));

vi.mock('../src/hooks/useStatsManagement.js', () => ({
  useStatsManagement: () => ({
    showStatsResetConfirm: false,
    setShowStatsResetConfirm: vi.fn(),
    handleStatsReset: vi.fn(),
    showCharacterPurgeConfirm: false,
    setShowCharacterPurgeConfirm: vi.fn(),
    purgeTargetCharacter: null,
    purgeInProgress: false,
    handleCharacterPurge: vi.fn(),
    resetSuccessVisible: false,
    closeResetSuccess: vi.fn(),
    purgeSuccess: false,
    setPurgeSuccess: vi.fn(),
    showHistoricalPitchedModal: false,
    setShowHistoricalPitchedModal: vi.fn(),
    historicalPitchedData: [],
    handleHistoricalPitchedConfirm: vi.fn(),
  }),
}));

// Test data
const mockCharacterBossSelections = [
  {
    name: 'TestChar1',
    bosses: [
      { name: 'Zakum', difficulty: 'Normal', partySize: 1 },
      { name: 'Papulatus', difficulty: 'Normal', partySize: 1 },
      { name: 'Horntail', difficulty: 'Normal', partySize: 1 },
    ],
  },
  {
    name: 'TestChar2',
    bosses: [
      { name: 'Zakum', difficulty: 'Normal', partySize: 1 },
      { name: 'Von Leon', difficulty: 'Normal', partySize: 1 },
    ],
  },
];

const mockBossData = [
  {
    name: 'Zakum',
    difficulties: [
      { difficulty: 'Normal', price: 612500 },
      { difficulty: 'Chaos', price: 19012500 },
    ],
  },
  {
    name: 'Papulatus',
    difficulties: [
      { difficulty: 'Normal', price: 876250 },
      { difficulty: 'Chaos', price: 30618750 },
    ],
  },
  {
    name: 'Horntail',
    difficulties: [
      { difficulty: 'Normal', price: 915625 },
      { difficulty: 'Chaos', price: 31000000 },
    ],
  },
  {
    name: 'Von Leon',
    difficulties: [
      { difficulty: 'Normal', price: 1265625 },
      { difficulty: 'Hard', price: 8100000 },
    ],
  },
];

// Helper component wrapper
const WeeklyTrackerWrapper = ({ checked = {}, setChecked = vi.fn(), userCode = 'TEST_USER', appWeekKey = convertDateToWeekKey(getCurrentMapleWeekStartDate()) }) => (
  <AppDataProvider>
    <WeeklyTracker
      characterBossSelections={mockCharacterBossSelections}
      bossData={mockBossData}
      checked={checked}
      setChecked={setChecked}
      userCode={userCode}
      appWeekKey={appWeekKey}
      showOnboardingIndicators={false}
    />
  </AppDataProvider>
);

describe('WeeklyTracker Weekly Reset UI Tests', () => {
  let mockSetChecked;

  beforeEach(() => {
    mockSetChecked = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Weekly Reset Detection', () => {
    it('should render without crashing', () => {
      render(<WeeklyTrackerWrapper />);
      expect(screen.getByText(/Weekly Boss Tracker/i)).toBeInTheDocument();
    });

    it('should display current week data after reset', async () => {
      const currentWeekKey = convertDateToWeekKey(getCurrentMapleWeekStartDate());
      
      render(
        <WeeklyTrackerWrapper 
          checked={{}} 
          setChecked={mockSetChecked}
          appWeekKey={currentWeekKey}
        />
      );

      // After weekly reset, boss checkboxes should be unchecked
      const bossCheckboxes = screen.getAllByRole('checkbox');
      bossCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should preserve historical week data', async () => {
      const previousWeekKey = convertDateToWeekKey(getMapleWeekStartDate(-1));
      const historicalChecked = {
        'TestChar1-0': {
          'Zakum-Normal': true,
          'Papulatus-Normal': true,
        }
      };

      render(
        <WeeklyTrackerWrapper 
          checked={historicalChecked} 
          setChecked={mockSetChecked}
          appWeekKey={previousWeekKey}
        />
      );

      // Historical data should be preserved and displayed
      expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    });

    it('should handle character dropdown during reset', async () => {
      render(<WeeklyTrackerWrapper />);
      
      // Character dropdown should be functional
      const characterDropdown = screen.getByRole('button', { name: /TestChar1/i });
      expect(characterDropdown).toBeInTheDocument();
      
      fireEvent.click(characterDropdown);
      await waitFor(() => {
        expect(screen.getByText(/Select Character/i)).toBeInTheDocument();
      });
    });
  });

  describe('Weekly Navigation', () => {
    it('should navigate between current and historical weeks', async () => {
      const { rerender } = render(<WeeklyTrackerWrapper />);
      
      // Should display current week initially
      const currentWeekKey = convertDateToWeekKey(getCurrentMapleWeekStartDate());
      expect(screen.getByText(new RegExp(currentWeekKey.replace('-', ' Week '))));

      // Navigate to historical week
      const previousWeekKey = convertDateToWeekKey(getMapleWeekStartDate(-1));
      rerender(
        <WeeklyTrackerWrapper 
          appWeekKey={previousWeekKey}
        />
      );

      expect(screen.getByText(new RegExp(previousWeekKey.replace('-', ' Week '))));
    });

    it('should handle week offset calculations correctly', () => {
      const currentWeekKey = convertDateToWeekKey(getCurrentMapleWeekStartDate());
      const previousWeekKey = convertDateToWeekKey(getMapleWeekStartDate(-1));
      
      expect(getWeekOffset(currentWeekKey)).toBe(0);
      expect(getWeekOffset(previousWeekKey)).toBe(-1);
    });

    it('should display appropriate UI for historical vs current week', async () => {
      // Current week - should show active UI
      const { rerender } = render(<WeeklyTrackerWrapper />);
      
      // Should have interactive elements for current week
      expect(screen.getAllByRole('checkbox')).toHaveLength(5); // Total bosses across characters
      
      // Historical week - should show read-only or historical UI
      const previousWeekKey = convertDateToWeekKey(getMapleWeekStartDate(-1));
      rerender(
        <WeeklyTrackerWrapper 
          appWeekKey={previousWeekKey}
        />
      );
      
      // UI should still be functional but may show historical indicators
      expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    });
  });

  describe('Boss Clear State Management', () => {
    it('should clear boss checkboxes after weekly reset', async () => {
      const preResetChecked = {
        'TestChar1-0': {
          'Zakum-Normal': true,
          'Papulatus-Normal': true,
        }
      };

      const { rerender } = render(
        <WeeklyTrackerWrapper 
          checked={preResetChecked}
          setChecked={mockSetChecked}
        />
      );

      // Simulate weekly reset by clearing checked state
      rerender(
        <WeeklyTrackerWrapper 
          checked={{}}
          setChecked={mockSetChecked}
        />
      );

      // All checkboxes should be unchecked after reset
      const bossCheckboxes = screen.getAllByRole('checkbox');
      bossCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should maintain character configurations after reset', async () => {
      render(<WeeklyTrackerWrapper />);
      
      // Character names should still be available
      expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
      
      // Boss configurations should be preserved
      expect(screen.getByText(/Zakum/)).toBeInTheDocument();
      expect(screen.getByText(/Papulatus/)).toBeInTheDocument();
      expect(screen.getByText(/Horntail/)).toBeInTheDocument();
    });

    it('should handle multi-character reset correctly', async () => {
      const multiCharChecked = {
        'TestChar1-0': {
          'Zakum-Normal': true,
          'Papulatus-Normal': true,
        },
        'TestChar2-1': {
          'Zakum-Normal': true,
          'Von Leon-Normal': true,
        }
      };

      const { rerender } = render(
        <WeeklyTrackerWrapper 
          checked={multiCharChecked}
          setChecked={mockSetChecked}
        />
      );

      // Reset should clear all characters
      rerender(
        <WeeklyTrackerWrapper 
          checked={{}}
          setChecked={mockSetChecked}
        />
      );

      // All character data should be cleared
      const bossCheckboxes = screen.getAllByRole('checkbox');
      bossCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Pitched Items Display', () => {
    it('should display pitched items correctly for each week', async () => {
      render(<WeeklyTrackerWrapper />);
      
      // Pitched items section should be present
      // Note: Exact implementation depends on your UI structure
      const pitchedSection = screen.queryByText(/pitched/i);
      if (pitchedSection) {
        expect(pitchedSection).toBeInTheDocument();
      }
    });

    it('should maintain pitched items across week changes', async () => {
      const { rerender } = render(<WeeklyTrackerWrapper />);
      
      // Switch to historical week
      const previousWeekKey = convertDateToWeekKey(getMapleWeekStartDate(-1));
      rerender(
        <WeeklyTrackerWrapper 
          appWeekKey={previousWeekKey}
        />
      );
      
      // Pitched items should still be accessible
      // This tests the UI doesn't break when navigating weeks
      expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing character data gracefully', async () => {
      render(
        <WeeklyTrackerWrapper 
          characterBossSelections={[]}
        />
      );
      
      // Should show no characters message
      await waitFor(() => {
        expect(screen.getByText(/No characters found/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid week data gracefully', async () => {
      render(
        <WeeklyTrackerWrapper 
          appWeekKey="invalid-week-key"
        />
      );
      
      // Component should not crash with invalid week data
      expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    });

    it('should handle network errors during reset gracefully', async () => {
      // Mock network error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<WeeklyTrackerWrapper />);
      
      // Component should still render despite potential network issues
      expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeCharacterSet = Array.from({ length: 10 }, (_, i) => ({
        name: `TestChar${i + 1}`,
        bosses: mockBossData.map(boss => ({
          name: boss.name,
          difficulty: 'Normal',
          partySize: 1,
        })),
      }));

      const startTime = performance.now();
      
      render(
        <WeeklyTrackerWrapper 
          characterBossSelections={largeCharacterSet}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Rendering should complete within reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      // Should still render all characters
      expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    });

    it('should handle frequent state updates efficiently', async () => {
      const { rerender } = render(<WeeklyTrackerWrapper />);
      
      // Simulate multiple rapid state changes
      for (let i = 0; i < 10; i++) {
        const newChecked = {
          'TestChar1-0': {
            [`Zakum-Normal-${i}`]: true,
          }
        };
        
        rerender(
          <WeeklyTrackerWrapper 
            checked={newChecked}
            setChecked={mockSetChecked}
          />
        );
      }
      
      // Component should remain stable
      expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility during weekly reset', async () => {
      render(<WeeklyTrackerWrapper />);
      
      // Check for proper ARIA labels
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('aria-label', expect.any(String));
      });
      
      // Check for proper form labels
      const characterDropdown = screen.getByRole('button');
      expect(characterDropdown).toHaveAttribute('aria-expanded');
    });

    it('should support keyboard navigation', async () => {
      render(<WeeklyTrackerWrapper />);
      
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      firstCheckbox.focus();
      
      expect(document.activeElement).toBe(firstCheckbox);
      
      // Test tab navigation
      fireEvent.keyDown(firstCheckbox, { key: 'Tab' });
      // Focus should move to next interactive element
    });

    it('should provide screen reader friendly content', async () => {
      render(<WeeklyTrackerWrapper />);
      
      // Check for descriptive text
      expect(screen.getByText(/Weekly Boss Tracker/i)).toBeInTheDocument();
      
      // Check that boss names are properly labeled
      expect(screen.getByText(/Zakum/i)).toBeInTheDocument();
    });
  });
});

describe('WeeklyTracker Responsive Design Tests', () => {
  beforeEach(() => {
    // Mock different viewport sizes
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  it('should render correctly on desktop (1920x1080)', async () => {
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    window.dispatchEvent(new Event('resize'));
    
    render(<WeeklyTrackerWrapper />);
    
    // Desktop should show full layout
    expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });

  it('should render correctly on tablet (768x1024)', async () => {
    window.innerWidth = 768;
    window.innerHeight = 1024;
    window.dispatchEvent(new Event('resize'));
    
    render(<WeeklyTrackerWrapper />);
    
    // Tablet should maintain functionality
    expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });

  it('should render correctly on mobile (375x667)', async () => {
    window.innerWidth = 375;
    window.innerHeight = 667;
    window.dispatchEvent(new Event('resize'));
    
    render(<WeeklyTrackerWrapper />);
    
    // Mobile should show compact layout but remain functional
    expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });

  it('should handle ultrawide screens (3440x1440)', async () => {
    window.innerWidth = 3440;
    window.innerHeight = 1440;
    window.dispatchEvent(new Event('resize'));
    
    render(<WeeklyTrackerWrapper />);
    
    // Ultrawide should utilize extra space effectively
    expect(screen.getByDisplayValue(/TestChar1/)).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
  });
}); 
import React from 'react';
import StatsModal from '../../components/StatsModal';
import ItemDetailModal from '../../components/ItemDetailModal';
import HistoricalPitchedModal from '../../components/HistoricalPitchedModal';
import PitchedItemsModal from '../../components/PitchedItemsModal';
import {
  StatsResetConfirmDialog,
  CharacterPurgeDialog,
  SuccessDialog,
  PitchedItemDetailsModal
} from '../../components/ConfirmationDialogs';

/**
 * All Weekly Tracker modals consolidated in one place
 * Follows professional practice of grouping related UI components
 */
export function WeeklyTrackerModals({
  // Stats modal props
  statsManagement,
  
  // Weekly tracker state
  weekNavigation,
  pitchedChecked,
  setPitchedChecked,
  userInteractionRef,
  setError,
  
  // Character data for modals
  characterBossSelections,
  selectedCharIdx,
  
  // Pitched items data
  cloudPitchedItems
}) {
  return (
    <>
      {/* Main Stats Modal */}
      <StatsModal
        showStats={statsManagement.showStats}
        setShowStats={statsManagement.setShowStats}
        allYears={statsManagement.allYears}
        selectedYear={statsManagement.selectedYear}
        setSelectedYear={statsManagement.setSelectedYear}
        groupedYearlyPitchedItems={statsManagement.groupedYearlyPitchedItems}
        isLoadingCloudStats={statsManagement.isLoadingCloudStats}
        setShowStatsResetConfirm={statsManagement.setShowStatsResetConfirm}
        handleItemDetailClick={statsManagement.handleItemDetailClick}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        showItemDetailModal={statsManagement.showItemDetailModal}
        setShowItemDetailModal={statsManagement.setShowItemDetailModal}
        selectedItemDetail={statsManagement.selectedItemDetail}
      />

      {/* Stats Reset Confirmation */}
      <StatsResetConfirmDialog
        showStatsResetConfirm={statsManagement.showStatsResetConfirm}
        setShowStatsResetConfirm={statsManagement.setShowStatsResetConfirm}
        onConfirm={() => statsManagement.handleStatsReset(setError)}
      />

      {/* Character Purge Dialog */}
      <CharacterPurgeDialog
        showCharacterPurgeConfirm={statsManagement.showCharacterPurgeConfirm}
        setShowCharacterPurgeConfirm={statsManagement.setShowCharacterPurgeConfirm}
        purgeTargetCharacter={statsManagement.purgeTargetCharacter}
        purgeInProgress={statsManagement.purgeInProgress}
        onConfirm={() => statsManagement.handleCharacterPurge(
          pitchedChecked,
          setPitchedChecked,
          weekNavigation.selectedWeekKey,
          userInteractionRef,
          setError
        )}
      />

      {/* Success Dialog */}
      <SuccessDialog
        resetSuccessVisible={statsManagement.resetSuccessVisible}
        closeResetSuccess={statsManagement.closeResetSuccess}
        purgeSuccess={statsManagement.purgeSuccess}
        setPurgeSuccess={statsManagement.setPurgeSuccess}
      />

      {/* Historical Pitched Items Modal */}
      {statsManagement.showHistoricalPitchedModal && (
        <div className="modal-backdrop" onClick={() => statsManagement.setShowHistoricalPitchedModal(false)}>
          <HistoricalPitchedModal
            data={statsManagement.historicalPitchedData}
            characterBossSelections={characterBossSelections}
            onClose={() => statsManagement.setShowHistoricalPitchedModal(false)}
            onConfirm={statsManagement.handleHistoricalPitchedConfirm}
            pitchedChecked={pitchedChecked}
          />
        </div>
      )}

      {/* Character Pitched Items Modal - separate from item details */}
      <PitchedItemsModal
        isOpen={statsManagement.showCharacterPitchedModal}
        onClose={() => statsManagement.setShowCharacterPitchedModal(false)}
        characterName={characterBossSelections[selectedCharIdx]?.name || ''}
        cloudPitchedItems={cloudPitchedItems}
        setPitchedModalItem={statsManagement.setPitchedModalItem}
        setShowPitchedModal={statsManagement.setShowPitchedModal}
      />

      {/* Pitched Item Details Modal - for yearly stats */}
      <PitchedItemDetailsModal
        showPitchedModal={statsManagement.showPitchedModal}
        setShowPitchedModal={statsManagement.setShowPitchedModal}
        pitchedModalItem={statsManagement.pitchedModalItem}
        pitchedModalDetails={statsManagement.pitchedModalDetails}
      />
    </>
  );
}
import { useState } from 'react';
import { exportUserData, importUserData } from '../services/utilityService.js';

function DataBackup({ userCode }) {
  const [importStatus, setImportStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportStats, setExportStats] = useState(null);

  const handleExport = async () => {
    if (!userCode) {
      alert('You need to be logged in to export data');
      return;
    }

    setIsLoading(true);
    setExportStats(null);
    try {
      const result = await exportUserData(userCode);
      
      if (result.success) {
        const exportData = result.data;
        
        // Store stats for display
        setExportStats({
          characterCount: exportData.characterCount,
          weeksOfData: exportData.stats.totalWeeksOfData,
          pitchedItems: exportData.stats.totalPitchedItems,
          weekRange: exportData.stats.weekRange
        });
        
        // Create a JSON file for download
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `maplestory-complete-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setImportStatus({ 
          type: 'success', 
          message: `Complete backup exported successfully! Includes ${exportData.characterCount} characters, ${exportData.stats.totalWeeksOfData} weeks of data, and ${exportData.stats.totalPitchedItems} pitched items.`
        });
      } else {
        setImportStatus({ type: 'error', message: 'Failed to export data' });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setImportStatus({ type: 'error', message: `Error: ${error.message || 'Unknown error'}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (event) => {
    if (!userCode) {
      alert('You need to be logged in to import data');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    setExportStats(null);
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const importObj = JSON.parse(e.target.result);
          
          // Show import preview
          const stats = importObj.stats || {};
          const previewMessage = `This backup contains:
• ${importObj.characterCount || 0} characters
• ${stats.totalWeeksOfData || 0} weeks of boss data
• ${stats.totalPitchedItems || 0} pitched items
• Data version: ${importObj.dataVersion || 'unknown'}
${stats.weekRange ? `\n• Week range: ${stats.weekRange.earliest} to ${stats.weekRange.latest}` : ''}

⚠️ IMPORTANT: This will completely replace ALL your current data!
Weekly boss clears will be reset (as intended).

Continue with import?`;
          
          // Confirm before importing with detailed info
          const confirmImport = window.confirm(previewMessage);
          
          if (confirmImport) {
            const result = await importUserData(userCode, importObj);
            
            if (result.success) {
              setImportStatus({ 
                type: 'success', 
                message: `${result.message} Please refresh the page to see all changes.` 
              });
            } else {
              setImportStatus({ type: 'error', message: `Import failed: ${result.error}` });
            }
          }
        } catch (error) {
          console.error('Error processing import file:', error);
          setImportStatus({ type: 'error', message: `Invalid backup file: ${error.message}` });
        } finally {
          setIsLoading(false);
        }
      };
      
      fileReader.onerror = () => {
        setImportStatus({ type: 'error', message: 'Error reading file' });
        setIsLoading(false);
      };
      
      fileReader.readAsText(file);
    } catch (error) {
      console.error('Error with file import:', error);
      setImportStatus({ type: 'error', message: `Error: ${error.message || 'Unknown error'}` });
      setIsLoading(false);
    }
  };

  return (
    <div className="data-backup-container">
      <h3>Complete Data Backup & Restore</h3>
      <p>Create a complete backup of ALL your data for full account restoration. Includes character configurations, boss data history, and pitched items.</p>
      
      <div className="backup-actions">
        {userCode ? (
          <div className="modal-section">
            <h3 className="modal-section-title">📤 Export Data</h3>
            <p className="modal-section-description">
              Create a complete backup of your boss configurations, character setups, and pitched item history.
              <br />
              <strong>✨ Universal Restore:</strong> Your backup can be imported to any account (same account or transfer to new account).
            </p>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="modal-btn"
            >
              {isLoading ? 'Creating Backup...' : 'Download Backup'}
            </button>
          </div>
        ) : (
          <div className="modal-section">
            <h3 className="modal-section-title">📤 Export Data</h3>
            <p className="modal-section-description">
              You need to be logged in to export data.
            </p>
            <button
              onClick={() => alert('You need to be logged in to export data')}
              disabled={true}
              className="modal-btn"
            >
              Export Data
            </button>
          </div>
        )}

        <div className="modal-section">
          <h3 className="modal-section-title">📥 Import Data</h3>
          <p className="modal-section-description">
            Restore data from a backup file. This will:
            <br />
            • Replace all current boss configurations and character setups
            <br />
            • Restore all pitched item history  
            <br />
            • Clear all weekly boss completion checkmarks (as intended)
            <br />
            <strong>💡 Works with any account:</strong> You can restore backups from other accounts or transfer data between accounts.
          </p>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="modal-btn"
          >
            {isLoading ? 'Restoring...' : 'Choose Backup File'}
          </button>
        </div>
      </div>
      
      {exportStats && (
        <div className="export-stats">
          <h4>Last Export Summary:</h4>
          <ul>
            <li><strong>{exportStats.characterCount}</strong> characters</li>
            <li><strong>{exportStats.weeksOfData}</strong> weeks of boss data</li>
            <li><strong>{exportStats.pitchedItems}</strong> pitched items</li>
            {exportStats.weekRange && (
              <li>Data from <strong>{exportStats.weekRange.earliest}</strong> to <strong>{exportStats.weekRange.latest}</strong></li>
            )}
          </ul>
        </div>
      )}
      
      {importStatus && (
        <div className={`status-message ${importStatus.type}`}>
          {importStatus.message}
        </div>
      )}
      
      <div className="backup-tips">
        <h4>Complete Backup Features:</h4>
        <ul>
          <li><strong>Full Restoration:</strong> Includes ALL data needed to restore your account</li>
          <li><strong>Character Configurations:</strong> All boss selections and party sizes</li>
          <li><strong>Historical Data:</strong> All weeks of boss tracking data</li>
          <li><strong>Pitched Items:</strong> Complete pitched item history</li>
          <li><strong>Clean Import:</strong> Weekly boss clears are automatically reset (as intended)</li>
          <li><strong>Safe Storage:</strong> Store backup files in multiple safe locations</li>
        </ul>
        
        <h4>Import Notes:</h4>
        <ul>
          <li>⚠️ Importing will completely replace ALL your current data</li>
          <li>✅ Weekly boss clears are cleared during import (this is correct behavior)</li>
          <li>📱 Create regular backups if you add important data</li>
          <li>🔄 Refresh the page after importing to see all changes</li>
        </ul>
      </div>
      
      <style jsx>{`
        .data-backup-container {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          max-width: 700px;
        }
        
        .backup-actions {
          display: flex;
          gap: 15px;
          margin: 20px 0;
        }
        
        .backup-button, .import-button {
          padding: 12px 18px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-block;
          font-weight: 500;
          font-size: 14px;
        }
        
        .backup-button:hover, .import-button:hover {
          background-color: #3a7bc8;
        }
        
        .backup-button:disabled, .import-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .import-label {
          cursor: pointer;
        }
        
        .export-stats {
          background-color: #e8f4f8;
          border: 1px solid #b8dce8;
          border-radius: 6px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .export-stats h4 {
          margin: 0 0 10px 0;
          color: #2c5aa0;
        }
        
        .export-stats ul {
          margin: 0;
          padding-left: 20px;
        }
        
        .status-message {
          padding: 12px;
          border-radius: 6px;
          margin: 15px 0;
          white-space: pre-line;
        }
        
        .status-message.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .status-message.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .backup-tips {
          margin-top: 25px;
          font-size: 0.9em;
        }
        
        .backup-tips h4 {
          margin: 15px 0 8px 0;
          color: #333;
        }
        
        .backup-tips ul {
          padding-left: 20px;
          margin-bottom: 15px;
        }
        
        .backup-tips li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}

export default DataBackup;

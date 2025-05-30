import { useState } from 'react';
import { exportUserData, importUserData } from '../../services/utilityService.js';

function DataBackup({ userCode }) {
  const [importStatus, setImportStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    if (!userCode) {
      alert('You need to be logged in to export data');
      return;
    }

    setIsLoading(true);
    try {
      const result = await exportUserData(userCode);
      
      if (result.success) {
        // Create a JSON file for download
        const dataStr = JSON.stringify(result.export, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `maplestory-data-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        setImportStatus({ type: 'success', message: 'Data exported successfully!' });
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
    try {
      const fileReader = new FileReader();
      
      fileReader.onload = async (e) => {
        try {
          const importObj = JSON.parse(e.target.result);
          
          // Confirm before importing
          const confirmImport = window.confirm(
            'Importing this data will replace your current data. Continue?'
          );
          
          if (confirmImport) {
            const result = await importUserData(userCode, importObj);
            
            if (result.success) {
              setImportStatus({ type: 'success', message: 'Data imported successfully! Refresh the page to see changes.' });
            } else {
              setImportStatus({ type: 'error', message: 'Failed to import data' });
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
      <h3>Backup & Restore Data</h3>
      <p>Backup your data to protect against database issues or account problems.</p>
      
      <div className="backup-actions">
        <button 
          onClick={handleExport} 
          disabled={isLoading || !userCode}
          className="backup-button"
        >
          {isLoading ? 'Processing...' : 'Export Data Backup'}
        </button>
        
        <div className="import-container">
          <label className="import-label">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isLoading || !userCode}
              style={{ display: 'none' }}
            />
            <span className="import-button">
              {isLoading ? 'Processing...' : 'Import Data Backup'}
            </span>
          </label>
        </div>
      </div>
      
      {importStatus && (
        <div className={`status-message ${importStatus.type}`}>
          {importStatus.message}
        </div>
      )}
      
      <div className="backup-tips">
        <h4>Tips:</h4>
        <ul>
          <li>Store your backup file in a safe location</li>
          <li>Create regular backups if you add important data</li>
          <li>Importing will replace all your current data</li>
        </ul>
      </div>
      
      <style jsx>{`
        .data-backup-container {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          max-width: 600px;
        }
        
        .backup-actions {
          display: flex;
          gap: 15px;
          margin: 20px 0;
        }
        
        .backup-button, .import-button {
          padding: 10px 15px;
          background-color: #4a90e2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: inline-block;
          font-weight: 500;
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
        
        .status-message {
          padding: 10px;
          border-radius: 4px;
          margin: 15px 0;
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
          margin-top: 20px;
          font-size: 0.9em;
        }
        
        .backup-tips h4 {
          margin-bottom: 10px;
        }
        
        .backup-tips ul {
          padding-left: 20px;
        }
      `}</style>
    </div>
  );
}

export default DataBackup;

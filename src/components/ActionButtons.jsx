import { Tooltip } from './Tooltip';

function ActionButtons({ 
  onExport, 
  onImport, 
  onShowQuickSelect, 
  fileInputRef 
}) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      gap: '10px', 
      marginBottom: '0.5rem', 
      flexWrap: 'wrap' 
    }}>
      <Tooltip text="Export all character data as a backup file">
        <button 
          onClick={onExport} 
          style={{ 
            background: '#805ad5', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '0.5rem 1.2rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#9f7aea';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(128, 90, 213, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#805ad5';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Backup Data
        </button>
      </Tooltip>
      
      <Tooltip text="Import character data from a backup file">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          style={{ 
            background: '#a259f7', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '0.5rem 1.2rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#b470ff';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(162, 89, 247, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#a259f7';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Restore Backup
        </button>
      </Tooltip>
      
      {/* Preset button removed */}
      
      <Tooltip text="Quick select up to 14 bosses sorted by highest price">
        <button 
          onClick={onShowQuickSelect} 
          style={{ 
            background: '#f56565', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            padding: '0.5rem 1.2rem', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)'
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#fc8181';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 101, 101, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = '#f56565';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11H1l6-6 6 6"/>
            <path d="M9 17l3-3 3 3"/>
            <path d="M22 18.5V2l-5 5-5-5v16.5"/>
          </svg>
          Quick Select
        </button>
      </Tooltip>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImport}
        accept=".json"
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default ActionButtons; 
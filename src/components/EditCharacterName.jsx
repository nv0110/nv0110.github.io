import { useState } from 'react';

function EditCharacterName({ name, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [isFocused, setIsFocused] = useState(false);
  
  if (!editing) {
    return (
      <button
        className="character-name-edit-btn"
        title="Edit character name"
        onClick={() => setEditing(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#a259f7',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: 4
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path fill="currentColor" d="M20.548 3.452a1.542 1.542 0 0 1 0 2.182l-7.636 7.636-3.273 1.091 1.091-3.273 7.636-7.636a1.542 1.542 0 0 1 2.182 0zM4 21h15a1 1 0 0 0 1-1v-8a1 1 0 0 0-2 0v7H5V6h7a1 1 0 0 0 0-2H4a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1z"/>
        </svg>
      </button>
    );
  }
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 0, marginRight: 4 }}>
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{
          fontSize: '0.95em',
          borderRadius: 8,
          border: isFocused ? '1px solid #a259f7' : '1px solid #4a4370',
          padding: '4px 8px',
          marginRight: 4,
          minWidth: 80,
          maxWidth: 120,
          background: '#3a335a',
          color: '#e6e0ff',
          boxShadow: isFocused ? '0 0 0 2px rgba(162, 89, 247, 0.3), 0 0 10px rgba(255, 255, 255, 0.15)' : 'none',
          transition: 'all 0.25s ease',
          outline: 'none'
        }}
        autoFocus
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={e => {
          if (e.key === 'Enter') { onSave(value); setEditing(false); }
          if (e.key === 'Escape') { setEditing(false); setValue(name); }
        }}
      />
      <button
        style={{ 
          background: '#a259f7', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 8, 
          padding: '4px 8px', 
          marginRight: 4, 
          cursor: 'pointer', 
          fontSize: '0.95em',
          boxShadow: '0 2px 6px rgba(162, 89, 247, 0.3)',
          transition: 'all 0.2s ease'
        }}
        onClick={() => { onSave(value); setEditing(false); }}
        title="Save"
        onMouseOver={e => { e.currentTarget.style.background = '#b47aff'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={e => { e.currentTarget.style.background = '#a259f7'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        ✔
      </button>
      <button
        style={{ 
          background: 'transparent', 
          color: '#a259f7', 
          border: '1px solid #a259f7', 
          borderRadius: 8, 
          padding: '4px 8px', 
          cursor: 'pointer', 
          fontSize: '0.95em',
          transition: 'all 0.2s ease'
        }}
        onClick={() => { setEditing(false); setValue(name); }}
        title="Cancel"
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(162, 89, 247, 0.1)'; }}
        onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        ✖
      </button>
    </span>
  );
}

export default EditCharacterName; 
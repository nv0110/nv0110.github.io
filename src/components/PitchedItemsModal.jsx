import React, { useState, useEffect } from 'react';
import { getBossPitchedItems } from '../services/bossRegistryService.js';
import '../styles/pitched-modal.css';

function PitchedItemsModal({
  isOpen,
  onClose,
  characterName,
  cloudPitchedItems = [],
  setPitchedModalItem,
  setShowPitchedModal
}) {
  const [pitchedItems, setPitchedItems] = useState([]);

  // Calculate pitched items for the character
  useEffect(() => {
    if (!isOpen || !characterName) return;

    // Get all pitched items for this character from cloudPitchedItems
    const characterPitchedItems = cloudPitchedItems.filter(item =>
      item.charId === characterName
    );

    // Group by item name and calculate counts
    const itemMap = new Map();
    
    characterPitchedItems.forEach(item => {
      const key = item.item;
      if (!itemMap.has(key)) {
        // Try to find item image from boss registry
        // Since we don't have boss info in the simplified format, we'll need to search all bosses
        let itemImage = '/items/crystal.png'; // fallback
        
        // Search through all boss items to find the image
        const allBossNames = ['Lotus', 'Damien', 'Lucid', 'Will', 'Gloom', 'Darknell', 'Verus Hilla', 'Chosen Seren', 'Watcher Kalos', 'Kaling', 'Limbo'];
        for (const bossName of allBossNames) {
          const bossItems = getBossPitchedItems(bossName);
          const itemObj = bossItems.find(bossItem => bossItem.name === item.item);
          if (itemObj) {
            itemImage = itemObj.image;
            break;
          }
        }
        
        itemMap.set(key, {
          name: item.item,
          image: itemImage,
          count: 0,
          history: []
        });
      }
      
      const entry = itemMap.get(key);
      entry.count += 1;
      entry.history.push({
        date: item.date
      });
    });

    // Sort by count descending
    const sortedItems = Array.from(itemMap.values())
      .sort((a, b) => b.count - a.count);

    setPitchedItems(sortedItems);
  }, [isOpen, characterName, cloudPitchedItems]);

  const handleItemClick = (item) => {
    if (!setPitchedModalItem || !setShowPitchedModal) return;
    
    // Convert the history format for the detail modal
    const details = item.history.map(historyItem => ({
      char: characterName,
      date: new Date(historyItem.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
    
    // Set the modal item data
    setPitchedModalItem({
      name: item.name,
      image: item.image,
      history: details
    });
    
    // Open the detail modal
    setShowPitchedModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="pitched-modal-backdrop" onClick={onClose}>
      <div className={`pitched-modal ${pitchedItems.length === 0 ? 'pitched-modal-no-scroll' : ''}`} onClick={e => e.stopPropagation()}>
        <button className="pitched-modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="closeGradient" x1="0" y1="0" x2="24" y2="24">
                <stop stopColor="#a259f7" />
                <stop offset="1" stopColor="#805ad5" />
              </linearGradient>
            </defs>
            <path
              d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
              fill="url(#closeGradient)"
            />
          </svg>
        </button>
        
        <h2 className="pitched-modal-title">
          {characterName ? `${characterName}'s Pitched Items` : 'Pitched Items'}
        </h2>

        {pitchedItems.length > 0 ? (
          <div className="pitched-modal-list-container">
            <div className="pitched-modal-list">
              {pitchedItems.map((item) => (
                <div 
                  key={item.name} 
                  className="pitched-modal-item"
                  onClick={() => handleItemClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pitched-modal-item-glow"></div>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="pitched-modal-item-img"
                  />
                  <div className="pitched-modal-item-name">{item.name}</div>
                  <div className="pitched-modal-item-count">{item.count}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="pitched-modal-empty">
            <div className="empty-star-container">
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="emptyStarGradient" x1="0" y1="0" x2="24" y2="24">
                    <stop stopColor="#a259f7" />
                    <stop offset="1" stopColor="#6a11cb" />
                  </linearGradient>
                  <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feFlood floodColor="#a259f7" floodOpacity="0.5" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="glow" />
                    <feComposite in="SourceGraphic" in2="glow" operator="over" />
                  </filter>
                </defs>
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="url(#emptyStarGradient)"
                  stroke="#e6e0ff"
                  strokeWidth="1.5"
                  filter="url(#starGlow)"
                  className="empty-star-path"
                />
              </svg>
            </div>
            <h3 className="empty-title">No pitched items yet</h3>
            <p className="empty-desc">
              {characterName ? `${characterName} hasn't` : "You haven't"} obtained any pitched items yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PitchedItemsModal;
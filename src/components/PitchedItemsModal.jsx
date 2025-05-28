import React, { useState, useRef, useEffect } from 'react';
import '../styles/pitched-modal.css';
import { createPortal } from 'react-dom';

function groupPitchedItems(items) {
  // Group by item name and image
  const map = new Map();
  items.forEach(item => {
    const key = item.item + '|' + item.image;
    if (!map.has(key)) {
      map.set(key, { ...item, count: 1, history: [item] });
    } else {
      const entry = map.get(key);
      entry.count += 1;
      entry.history.push(item);
    }
  });
  // Sort by count desc, then name
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.item.localeCompare(b.item));
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  // Ensure month names are always in English regardless of user's locale
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  
  return { 
    year,
    month,
    day,
    fullDate: `${month} ${day}, ${year}`
  };
}

function PitchedItemDetailsModal({ item, onClose }) {
  // Use a ref for the modal element to handle click outside
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Add a subtle entrance animation when the modal appears
  useEffect(() => {
    const timer = setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.classList.add('pitched-details-modal-visible');
      }
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <div className="pitched-details-modal-backdrop">
      <div className="pitched-details-modal" ref={modalRef}>
        <div className="pitched-details-modal-header">
          <div className="pitched-details-modal-item-showcase">
            <img src={item.image} alt={item.item} className="pitched-details-modal-item-img" />
            <div className="pitched-details-modal-item-info">
              <h2 className="pitched-details-modal-title">{item.item}</h2>
              <div className="pitched-details-modal-subtitle">
                <span className="pitched-details-modal-count">{item.count}x</span>
                <span className="pitched-details-modal-acquired">Acquired</span>
              </div>
            </div>
          </div>
          <button className="pitched-details-modal-close" onClick={onClose} aria-label="Close details">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="detailsCloseGradient" x1="0" y1="0" x2="24" y2="24">
                  <stop stopColor="#a259f7" />
                  <stop offset="1" stopColor="#805ad5" />
                </linearGradient>
              </defs>
              <path
                d="M6.2253 4.81108C5.83477 4.42056 5.20161 4.42056 4.81108 4.81108C4.42056 5.20161 4.42056 5.83477 4.81108 6.2253L10.5858 12L4.81114 17.7747C4.42062 18.1652 4.42062 18.7984 4.81114 19.1889C5.20167 19.5794 5.83483 19.5794 6.22535 19.1889L12 13.4142L17.7747 19.1889C18.1652 19.5794 18.7984 19.5794 19.1889 19.1889C19.5794 18.7984 19.5794 18.1652 19.1889 17.7747L13.4142 12L19.189 6.2253C19.5795 5.83477 19.5795 5.20161 19.189 4.81108C18.7985 4.42056 18.1653 4.42056 17.7748 4.81108L12 10.5858L6.2253 4.81108Z"
                fill="url(#detailsCloseGradient)"
              />
            </svg>
          </button>
        </div>
        
        <div className="pitched-details-modal-content">
          <div className="pitched-details-acquisition">
            <div className="pitched-details-section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2V6" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 18V22" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
                <path d="M4.92999 4.93L7.75999 7.76" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
                <path d="M16.24 16.24L19.07 19.07" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 12H6" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
                <path d="M18 12H22" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
                <path d="M4.92999 19.07L7.75999 16.24" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
                <path d="M16.24 7.76L19.07 4.93" stroke="#a259f7" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <h3>Acquisition History</h3>
            </div>
            
            <div className="pitched-details-table-container">
              <table className="pitched-details-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Month</th>
                    <th>Day</th>
                  </tr>
                </thead>
                <tbody>
                  {item.history
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((entry, idx) => {
                      const dateInfo = formatDate(entry.date);
                      return (
                        <tr key={idx} className={`pitched-details-row ${idx % 2 === 0 ? 'even-row' : 'odd-row'}`}>
                          <td className="pitched-details-year" title={dateInfo.fullDate}>
                            <div className="date-value">{dateInfo.year}</div>
                          </td>
                          <td className="pitched-details-month">
                            <div className="date-value">{dateInfo.month}</div>
                          </td>
                          <td className="pitched-details-day">
                            <div className="date-value">{dateInfo.day}</div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PitchedItemsModal({ isOpen, onClose, characterName, pitchedItems }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const itemListRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const startXRef = useRef(null);
  const scrollLeftRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Check scroll position and update indicators
  const checkScrollable = () => {
    const element = itemListRef.current;
    if (element) {
      const hasScrollableContent = element.scrollWidth > element.clientWidth;
      const isAtLeft = element.scrollLeft <= 5; // 5px tolerance
      const isAtRight = element.scrollLeft + element.clientWidth >= element.scrollWidth - 5; // 5px tolerance
      
      setShowLeftScroll(hasScrollableContent && !isAtLeft && !isScrolling);
      setShowRightScroll(hasScrollableContent && !isAtRight && !isScrolling);
    }
  };
  
  // Handle scroll events
  const handleScroll = () => {
    setIsScrolling(true);
    setShowLeftScroll(false);
    setShowRightScroll(false);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to show indicators again after scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      checkScrollable();
    }, 1000);
  };
  
  // Scroll to right or left
  const scrollItems = (direction) => {
    const element = itemListRef.current;
    if (element) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      element.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  
  // We'll use the browser's default horizontal scrolling (shift+mousewheel)
  
  // Initialize and cleanup
  useEffect(() => {
    if (isOpen) {
      const element = itemListRef.current;
      if (element) {
        // Add event listeners
        element.addEventListener('scroll', handleScroll);
        
        // Check initial scroll state
        setTimeout(checkScrollable, 300); // Allow time for layout to complete
        
        // Cleanup event listeners
        return () => {
          element.removeEventListener('scroll', handleScroll);
          
          // Clear timeout
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }
        };
      }
    }
  }, [isOpen]);
  
  // Disable body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the current overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      // Disable scrolling on the body
      document.body.style.overflow = 'hidden';
      
      // Re-enable scrolling when component unmounts
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const grouped = groupPitchedItems(pitchedItems || []);

  return (
    <div className="pitched-modal-backdrop" onClick={onClose}>
      <div className={`pitched-modal ${grouped.length === 0 ? 'pitched-modal-no-scroll' : ''}`} onClick={e => e.stopPropagation()}>
        {selectedItem && (
          <PitchedItemDetailsModal 
            item={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}
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
        {grouped.length === 0 ? (
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
            <h3 className="empty-title">No pitched items tracked yet</h3>
            <p className="empty-desc">Track your pitched items to see them here</p>
          </div>
        ) : (
          <div className="pitched-modal-list-container">
            <div 
              className="pitched-modal-list" 
              ref={itemListRef}
            >
              {grouped.map(item => {
                const key = item.item + '|' + item.image;
                return (
                  <div
                    key={key}
                    className="pitched-modal-item"
                    tabIndex={0}
                    onClick={() => setSelectedItem(item)}
                    title={`View ${item.item} acquisition history`}
                  >
                    <div className="pitched-modal-item-glow"></div>
                    <img
                      src={item.image}
                      alt={item.item}
                      className="pitched-modal-item-img"
                      draggable="false"
                    />
                    <div className="pitched-modal-item-name">{item.item}</div>
                    <div className="pitched-modal-item-count">{item.count}x</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PitchedItemsModal; 
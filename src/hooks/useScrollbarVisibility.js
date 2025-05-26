import { useEffect } from 'react';

export const useScrollbarVisibility = () => {
  useEffect(() => {
    let scrollTimeout;
    
    const handleScroll = () => {
      // Add scrolling class to show scrollbars
      document.documentElement.classList.add('scrolling');
      
      // Clear existing timeout
      clearTimeout(scrollTimeout);
      
      // Set timeout to hide scrollbars after scrolling stops
      scrollTimeout = setTimeout(() => {
        document.documentElement.classList.remove('scrolling');
      }, 1000); // Hide after 1 second of no scrolling
    };
    
    // Add scroll event listeners
    const addScrollListeners = () => {
      // Listen for window scroll
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Listen for scroll on document
      document.addEventListener('scroll', handleScroll, { passive: true });
      
      // Use MutationObserver to catch dynamically added scrollable elements
      const observer = new MutationObserver(() => {
        // Re-add listeners to any new scrollable elements
        const scrollableElements = document.querySelectorAll('*');
        scrollableElements.forEach(element => {
          // Check if element is scrollable
          const hasVerticalScroll = element.scrollHeight > element.clientHeight;
          const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
          
          if (hasVerticalScroll || hasHorizontalScroll) {
            // Remove any existing listener first to avoid duplicates
            element.removeEventListener('scroll', handleScroll);
            element.addEventListener('scroll', handleScroll, { passive: true });
          }
        });
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      // Initial setup for existing elements
      const scrollableElements = document.querySelectorAll('*');
      scrollableElements.forEach(element => {
        const hasVerticalScroll = element.scrollHeight > element.clientHeight;
        const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
        
        if (hasVerticalScroll || hasHorizontalScroll) {
          element.addEventListener('scroll', handleScroll, { passive: true });
        }
      });
      
      return observer;
    };
    
    // Initial setup
    const observer = addScrollListeners();
    
    // Cleanup function
    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
      
      // Disconnect observer
      if (observer) {
        observer.disconnect();
      }
      
      // Remove listeners from all elements
      const scrollableElements = document.querySelectorAll('*');
      scrollableElements.forEach(element => {
        element.removeEventListener('scroll', handleScroll);
      });
      
      // Remove scrolling class
      document.documentElement.classList.remove('scrolling');
    };
  }, []);
};

export default useScrollbarVisibility; 
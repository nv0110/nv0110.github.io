import { useEffect, useRef } from 'react';

export function useScrollbarVisibility() {
  const scrollTimeout = useRef(null);
  const scrollableElements = useRef(new Set());

  useEffect(() => {
    const handleScroll = () => {
      document.documentElement.classList.add('scrolling');
      
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      scrollTimeout.current = setTimeout(() => {
        document.documentElement.classList.remove('scrolling');
      }, 150);
    };

    // Function to add scroll listeners to new elements
    const addScrollListeners = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              const hasVerticalScroll = element.scrollHeight > element.clientHeight;
              const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
              
              if ((hasVerticalScroll || hasHorizontalScroll) && !scrollableElements.current.has(element)) {
                element.addEventListener('scroll', handleScroll, { passive: true });
                scrollableElements.current.add(element);
              }
            }
          });
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Initial setup for existing elements
      document.querySelectorAll('*').forEach(element => {
        const hasVerticalScroll = element.scrollHeight > element.clientHeight;
        const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
        
        if ((hasVerticalScroll || hasHorizontalScroll) && !scrollableElements.current.has(element)) {
          element.addEventListener('scroll', handleScroll, { passive: true });
          scrollableElements.current.add(element);
        }
      });
      
      return observer;
    };
    
    // Initial setup
    const observer = addScrollListeners();
    
    // Store current elements for cleanup
    const currentElements = new Set(scrollableElements.current);
    
    // Cleanup function
    return () => {
      clearTimeout(scrollTimeout.current);
      
      // Remove listeners from all tracked elements
      currentElements.forEach(element => {
        element.removeEventListener('scroll', handleScroll);
      });
      scrollableElements.current.clear();
      
      // Disconnect observer
      if (observer) {
        observer.disconnect();
      }
      
      // Remove scrolling class
      document.documentElement.classList.remove('scrolling');
    };
  }, []);
}

export default useScrollbarVisibility; 
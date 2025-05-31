import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing scroll indicator visibility
 * Shows indicator when at the top of scrollable content
 * Hides when: content not scrollable, or scrolled down from top
 */
export const useScrollIndicator = (dependencies = []) => {
  const [showIndicator, setShowIndicator] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const checkIndicatorVisibility = () => {
      const hasScrollableContent = element.scrollHeight > element.clientHeight;
      const isAtTop = element.scrollTop <= 5; // Allow small tolerance for "at top"
      
      // Show indicator when content is scrollable AND user is at the top
      setShowIndicator(hasScrollableContent && isAtTop);
    };

    const handleScroll = () => {
      checkIndicatorVisibility();
    };

    // Initial check
    checkIndicatorVisibility();

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, dependencies);

  return {
    showIndicator,
    elementRef
  };
}; 
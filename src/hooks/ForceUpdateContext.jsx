import React, { useState, createContext, useContext } from 'react';

// Create a context to hold the force update trigger
export const ForceUpdateContext = createContext({
  forceUpdate: () => {},
  lastUpdate: 0
});

// Custom hook to use the force update context
export const useForceUpdate = () => useContext(ForceUpdateContext);

// Provider component for the force update context
export const ForceUpdateProvider = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState(0);
  
  const forceUpdate = () => {
    setLastUpdate(Date.now());
  };
  
  return (
    <ForceUpdateContext.Provider value={{ forceUpdate, lastUpdate }}>
      {children}
    </ForceUpdateContext.Provider>
  );
};

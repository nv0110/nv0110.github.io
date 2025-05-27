import React, { createContext, useContext } from 'react';
import { useAppData as useAppDataHook } from './useAppData';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const appData = useAppDataHook();
  return (
    <AppDataContext.Provider value={appData}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
} 
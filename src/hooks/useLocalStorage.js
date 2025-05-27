import { useState } from 'react';

// Custom hook for managing localStorage with JSON serialization
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return defaultValue;
      try {
        return JSON.parse(item);
      } catch {
        // If JSON parsing fails, check if it's a simple string value we can handle
        console.warn(`localStorage key "${key}" contains non-JSON data: "${item}". Using default value.`);
        // Clear the problematic data
        window.localStorage.removeItem(key);
        return defaultValue;
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = (value) => {
    try {
      setValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue];
}

// Custom hook for managing simple localStorage strings
export function useLocalStorageString(key, defaultValue = '') {
  const [value, setValue] = useState(() => {
    try {
      return window.localStorage.getItem(key) || defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = (value) => {
    try {
      setValue(value);
      if (value) {
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue];
} 
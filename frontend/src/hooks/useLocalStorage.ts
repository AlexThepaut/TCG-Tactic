import { useState } from 'react';
import { storage } from '@/utils';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    return storage.get(key, initialValue);
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      storage.set(key, valueToStore);
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error saving to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
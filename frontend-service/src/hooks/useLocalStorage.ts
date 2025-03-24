import { useCallback, useEffect, useState } from 'react';

/**
 * This should really only be used in a central place, like in a Context
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | null = null
): [T | null, (value: T | null | ((prev: T | null) => T | null)) => void] {
  const [storedValue, setStoredValue] = useState<T | null>(null);
  useEffect(() => {
    const item = localStorage.getItem(key);
    if (
      item === null ||
      item === 'null' ||
      item === undefined ||
      item === 'undefined' ||
      item === ''
    ) {
      setStoredValue(null);
      localStorage.removeItem(key);
      return;
    } else if (item) {
      const itemParsed = JSON.parse(item) as T;
      setStoredValue(itemParsed);
    } else {
      localStorage.setItem(key, JSON.stringify(initialValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = useCallback(
    (valueOrCallback: T | null | ((prevValue: T | null) => T | null)) => {
      let updatedValue = null;
      if (typeof valueOrCallback === 'function') {
        updatedValue = (valueOrCallback as (prevValue: T | null) => T | null)(storedValue);
      } else {
        updatedValue = valueOrCallback;
      }
      if (
        updatedValue === null ||
        updatedValue === 'null' ||
        updatedValue === undefined ||
        updatedValue === 'undefined' ||
        updatedValue === ''
      ) {
        localStorage.removeItem(key);
      } else if (typeof updatedValue !== 'function') {
        localStorage.setItem(key, JSON.stringify(updatedValue));
      }
      setStoredValue(updatedValue);
    },
    [key, storedValue]
  );
  return [storedValue, setValue];
}

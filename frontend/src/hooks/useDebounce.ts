import { useState, useEffect, useCallback } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number
): (...args: A) => void {
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useCallback(callback, [callback]);

  return useCallback(
    (...args: A) => {
      if (timeoutId) clearTimeout(timeoutId);
      const id = setTimeout(() => callbackRef(...args), delay);
      setTimeoutId(id);
    },
    [delay, callbackRef, timeoutId]
  );
}

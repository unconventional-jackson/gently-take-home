import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

type DebugContextType = {
  debug: boolean;
  setDebug: (value: boolean) => void;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const DebugContext = createContext<DebugContextType>({
  debug: false,
  setDebug: () => undefined,
});

export const useDebugContext = () => {
  const context = useContext(DebugContext);

  if (!context) {
    throw new Error('useDebugContext must be used within a DebugContextProvider');
  }

  return context;
};

/**
 * Global context to contain the top-level Prism Client that the user is currently interacting with
 */
export function DebugContextProvider({ children }: PropsWithChildren<unknown>) {
  /**
   * Hooks and state for the top-level Prism User (the actual person signed in, who could be an admin with access to one or more Prism Clients
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const [debug, setDebug] = useState<boolean>(false);

  const handleToggleDebug = useCallback(() => {
    setDebug((prev) => !prev);
    if (debug) {
      searchParams.delete('debug');
    } else if (!debug) {
      searchParams.set('debug', 'true');
    }
    setSearchParams(searchParams);
  }, [setDebug, debug, setSearchParams, searchParams]);

  useEffect(() => {
    console.log('searchParams', searchParams.get('debug'));
    if (searchParams.get('debug')) {
      setDebug(true);
    } else {
      setDebug(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DebugContext.Provider
      value={{
        debug: debug ?? false,
        setDebug: handleToggleDebug,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

import React, { createContext, useContext, useEffect, useState } from 'react';
import { detectCountry } from '../services/countryService';
import { logger } from '../utils/logger';

const TAG = 'CountryContext';

export const DEFAULT_COUNTRY_CODE = 'US';

interface CountryContextType {
  /** Detected ISO country code (e.g. "US"). Defaults to US on failure. */
  countryCode: string;
  /** Whether country detection is still running on the splash screen. */
  detecting: boolean;
  /** Error message from IP/country detection (null when successful). */
  error: string | null;
}

const CountryContext = createContext<CountryContextType>({
  countryCode: DEFAULT_COUNTRY_CODE,
  detecting: true,
  error: null,
});

export const CountryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [detecting, setDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    detectCountry()
      .then(result => {
        if (cancelled) return;
        if (result.countryCode) {
          setCountryCode(result.countryCode);
          setError(null);
          logger.info(TAG, `Country detected: ${result.countryCode}`);
        } else {
          setCountryCode(DEFAULT_COUNTRY_CODE);
          setError(
            result.error ||
              'Unable to detect your country. Showing default US packages.',
          );
          logger.warn(TAG, 'Country detection failed, using US fallback');
        }
      })
      .finally(() => {
        if (!cancelled) setDetecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CountryContext.Provider value={{ countryCode, detecting, error }}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = () => useContext(CountryContext);
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to fetch data and cache it.
 * Prioritizes sessionStorage for timed caching.
 * Optionally uses localStorage as a more persistent "source of truth" after initial fetch from URL.
 */
export function useFetchCached(cacheKey, url, options = {}) {
  const { cacheDuration = 5 * 60 * 1000, useLocalStoragePersistence = false } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const forceRefetch = useCallback(() => {
    console.log(`useFetchCached: Forcing refetch for "${cacheKey}". Clearing sessionStorage.`);
    try {
      sessionStorage.removeItem(cacheKey);
      // To truly force a re-fetch from the original URL and re-seed localStorage,
      // localStorage.removeItem(cacheKey); // would need to be called *before* this.
      // For now, forceRefetch clears session cache, leading to re-check of localStorage then URL.
    } catch (e) {
      console.warn(`useFetchCached: Could not remove item from sessionStorage for key "${cacheKey}"`, e);
    }
    setRefetchIndex(prevIndex => prevIndex + 1); // Trigger the useEffect
  }, [cacheKey]);


  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setData(null); 

    const fetchData = async () => {
      console.log(`useFetchCached: Attempting to get data for "${cacheKey}". Persistence: ${useLocalStoragePersistence}`);

      // 1. Try sessionStorage (timed cache)
      try {
        const sessionCachedItemString = sessionStorage.getItem(cacheKey);
        if (sessionCachedItemString) {
          const sessionCachedItem = JSON.parse(sessionCachedItemString);
          const currentTime = new Date().getTime();
          if (sessionCachedItem.timestamp && (currentTime - sessionCachedItem.timestamp < cacheDuration)) {
            if (isMounted) {
              setData(sessionCachedItem.data);
              setLoading(false);
            }
            console.log(`useFetchCached: Serving data for "${cacheKey}" from valid sessionStorage.`);
            return; 
          } else {
            console.log(`useFetchCached: SessionStorage for "${cacheKey}" expired or invalid.`);
            sessionStorage.removeItem(cacheKey);
          }
        }
      } catch (e) {
        console.warn(`useFetchCached: Error with sessionStorage for "${cacheKey}"`, e);
        sessionStorage.removeItem(cacheKey); 
      }

      // 2. If useLocalStoragePersistence is true, try localStorage
      if (useLocalStoragePersistence) {
        try {
          const localCachedItemString = localStorage.getItem(cacheKey); 
          if (localCachedItemString) { 
            const localCachedData = JSON.parse(localCachedItemString);
            // Ensure it's a non-empty array if we expect an array (like for "products")
            if (Array.isArray(localCachedData) && localCachedData.length > 0) {
                if (isMounted) {
                  setData(localCachedData);
                  try { // Refresh sessionStorage with this data from localStorage
                    sessionStorage.setItem(cacheKey, JSON.stringify({ data: localCachedData, timestamp: new Date().getTime() }));
                  } catch (se) {/* ignore session storage error */}
                  setLoading(false);
                }
                console.log(`useFetchCached: Serving data for "${cacheKey}" from localStorage (non-empty array).`);
                return; 
            } else if (!Array.isArray(localCachedData) || localCachedData.length === 0) {
                console.log(`useFetchCached: localStorage for "${cacheKey}" is empty/invalid. Will fetch from URL to re-seed.`);
                // Do not return; proceed to fetch from URL to re-seed localStorage.
            }
          } else {
            console.log(`useFetchCached: No data for "${cacheKey}" in localStorage. Will fetch from URL to seed it.`);
          }
        } catch (e) {
          console.warn(`useFetchCached: Error reading from localStorage for "${cacheKey}". Will fetch from URL.`, e);
          // Potentially clear corrupted localStorage entry before fetching to ensure clean seed
          // localStorage.removeItem(cacheKey); 
        }
      }

      // 3. If no valid cache (session or local was empty/invalid), fetch from URL
      console.log(`useFetchCached: Fetching data for "${cacheKey}" from URL: ${url}`);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        const fetchedData = await response.json();

        if (isMounted) {
          setData(fetchedData);
          try { // Store in sessionStorage (timed cache)
            sessionStorage.setItem(cacheKey, JSON.stringify({ data: fetchedData, timestamp: new Date().getTime() }));
            console.log(`useFetchCached: Data for "${cacheKey}" cached in sessionStorage.`);
          } catch (se) {
             console.warn(`useFetchCached: Could not set item in sessionStorage for key "${cacheKey}"`, se);
          }

          // If using localStorage persistence, store/overwrite it with the fresh data from the URL.
          // This acts as the initial seed or a reset if localStorage was found empty/invalid in step 2.
          if (useLocalStoragePersistence) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(fetchedData)); 
                console.log(`useFetchCached: Data for "${cacheKey}" (re-)seeded into localStorage from URL.`);
            } catch (le) {
                console.warn(`useFetchCached: Could not set item in localStorage for key "${cacheKey}" after fetching from URL.`, le);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error(`useFetchCached: Error fetching data for "${cacheKey}" from ${url}:`, err);
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false; 
    };
  }, [url, cacheKey, cacheDuration, useLocalStoragePersistence, refetchIndex]); 

  return { data, loading, error, forceRefetch };
}

export const invalidateCacheEntry = (cacheKey) => {
    try {
      sessionStorage.removeItem(cacheKey);
      console.log(`useFetchCached: Manually invalidated sessionStorage cache for key "${cacheKey}".`);
    } catch (e) {
      console.warn(`useFetchCached: Could not remove item from sessionStorage for key "${cacheKey}" during manual invalidation`, e);
    }
};

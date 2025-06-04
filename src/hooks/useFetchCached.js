import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

/**
 * Custom hook to fetch data using Axios and cache it.
 * Prioritizes sessionStorage for timed caching.
 * Optionally uses localStorage as a more persistent "source of truth" after initial fetch.
 */
export function useFetchCached(cacheKey, url, options = {}) {
  // url here is the relative path to the API endpoint (e.g., '/products', '/users/me')
  // apiClient will prepend the API_BASE_URL.

  const { cacheDuration = 5 * 60 * 1000, useLocalStoragePersistence = false } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchIndex, setRefetchIndex] = useState(0); // To trigger refetch

  const forceRefetch = useCallback(() => {
    console.log(`useFetchCached: Forcing refetch for "${cacheKey}". Clearing sessionStorage.`);
    try {
      sessionStorage.removeItem(cacheKey);
      // If you want to force a complete re-fetch from URL, also clear localStorage if it's used.
      // if (useLocalStoragePersistence) {
      //   localStorage.removeItem(cacheKey);
      // }
    } catch (e) {
      console.warn(`useFetchCached: Could not remove item from sessionStorage for key "${cacheKey}"`, e);
    }
    setRefetchIndex(prevIndex => prevIndex + 1); // Trigger the useEffect to refetch
  }, [cacheKey /*, useLocalStoragePersistence */]);


  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    // setData(null); // Optionally reset data on new fetch/refetch

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
            // Basic check if data seems valid (e.g., if expecting an array)
            const dataIsValid = Array.isArray(localCachedData) ? localCachedData.length > 0 : localCachedData !== null;

            if (dataIsValid) {
                if (isMounted) {
                  setData(localCachedData);
                  try { // Refresh sessionStorage with this data from localStorage
                    sessionStorage.setItem(cacheKey, JSON.stringify({ data: localCachedData, timestamp: new Date().getTime() }));
                  } catch (se) {
                    console.warn(`useFetchCached: Could not update sessionStorage for "${cacheKey}" from localStorage.`, se);
                  }
                  setLoading(false);
                }
                console.log(`useFetchCached: Serving data for "${cacheKey}" from localStorage.`);
                return;
            } else {
                console.log(`useFetchCached: localStorage for "${cacheKey}" is empty/invalid. Will fetch from URL to re-seed.`);
            }
          } else {
            console.log(`useFetchCached: No data for "${cacheKey}" in localStorage. Will fetch from URL to seed it.`);
          }
        } catch (e) {
          console.warn(`useFetchCached: Error reading from localStorage for "${cacheKey}". Will fetch from URL.`, e);
        }
      }

      // 3. If no valid cache, fetch from URL using apiClient
      console.log(`useFetchCached: Fetching data for "${cacheKey}" from API endpoint: ${url}`);
      try {
        const response = await apiClient.get(url); // Using apiClient.get()
        const fetchedData = response.data; // Data is in response.data with Axios

        if (isMounted) {
          setData(fetchedData);
          try { // Store in sessionStorage (timed cache)
            sessionStorage.setItem(cacheKey, JSON.stringify({ data: fetchedData, timestamp: new Date().getTime() }));
            console.log(`useFetchCached: Data for "${cacheKey}" cached in sessionStorage.`);
          } catch (se) {
             console.warn(`useFetchCached: Could not set item in sessionStorage for key "${cacheKey}"`, se);
          }

          if (useLocalStoragePersistence) {
            try {
                localStorage.setItem(cacheKey, JSON.stringify(fetchedData));
                console.log(`useFetchCached: Data for "${cacheKey}" (re-)seeded into localStorage from API.`);
            } catch (le) {
                console.warn(`useFetchCached: Could not set item in localStorage for key "${cacheKey}" after fetching from API.`, le);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err.response?.data?.message || err.message || "Failed to fetch data.";
          console.error(`useFetchCached: Error fetching data for "${cacheKey}" from ${url}:`, errorMessage, err.response || err);
          setError({ message: errorMessage, status: err.response?.status });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (url) { // Only fetch if URL is provided
        fetchData();
    } else {
        setLoading(false); // No URL, so not loading
    }


    return () => {
      isMounted = false;
    };
  }, [url, cacheKey, cacheDuration, useLocalStoragePersistence, refetchIndex]);

  return { data, loading, error, forceRefetch };
}

// invalidateCacheEntry function can remain largely the same,
// but it only clears sessionStorage. If localStorage is also used for persistence
// and needs to be cleared on demand, that would require an extension or a separate function.
export const invalidateCacheEntry = (cacheKey) => {
    try {
      sessionStorage.removeItem(cacheKey);
      console.log(`useFetchCached: Manually invalidated sessionStorage cache for key "${cacheKey}".`);
      // If you also want to clear the persistent localStorage on manual invalidation:
      // localStorage.removeItem(cacheKey);
      // console.log(`useFetchCached: Manually invalidated localStorage cache for key "${cacheKey}".`);
    } catch (e) {
      console.warn(`useFetchCached: Could not remove item from sessionStorage (or localStorage) for key "${cacheKey}" during manual invalidation`, e);
    }
};

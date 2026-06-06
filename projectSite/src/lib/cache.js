// Using a Map to store our cached data
const cache = new Map();

// Set how long we want to cache items in seconds.
const CACHE_TTL_SECONDS = 300; // 5 minutes

/**
 * Fetches data from a URL and caches the result.
 * @param {string} url The URL to fetch.
 * @returns {Promise<string>} The text content from the URL.
 */
export async function fetchAndCache(url) {
  const cachedEntry = cache.get(url);

  if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_SECONDS * 1000)) {
    // No need to log hits during pre-warming, but good for user requests
    if (process.env.NODE_ENV === 'development') {
        console.log(`[CACHE HIT] Serving from cache: ${url}`);
    }
    return cachedEntry.content;
  }

  if (!cachedEntry) {
      console.log(`[CACHE MISS] Fetching fresh content from: ${url}`);
  } else {
      console.log(`[CACHE STALE] Refreshing content for: ${url}`);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return `# README not found in repository.\n\nAttempted to fetch from: \`${url}\``;
    }
    const content = await response.text();
    cache.set(url, {
      content: content,
      timestamp: Date.now()
    });
    return content;
  } catch (error) {
    console.error(`Failed to fetch README from ${url}:`, error);
    return `# Error fetching README.\n\nCould not connect to the repository.`;
  }
}
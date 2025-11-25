export const FEED_PROXY_PATH = '/api/feed';

/**
 * Builds a feed endpoint URL that automatically proxies through the Next.js API
 * route when executing in the browser (to avoid CORS in local/dev environments).
 * Falls back to the direct backend base when running outside the browser (SSR or
 * during Node execution).
 */
export function buildFeedRequestUrl(baseApi: string, params: URLSearchParams): string {
  const queryString = params.toString();
  const shouldProxyThroughNext = typeof window !== 'undefined';

  if (shouldProxyThroughNext) {
    return queryString ? `${FEED_PROXY_PATH}?${queryString}` : FEED_PROXY_PATH;
  }

  const normalizedBase = baseApi.endsWith('/') ? baseApi.slice(0, -1) : baseApi;
  const remoteUrl = new URL(`${normalizedBase}/api/feed`);
  if (queryString) {
    remoteUrl.search = queryString;
  }
  return remoteUrl.toString();
}




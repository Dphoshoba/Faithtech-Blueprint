// Create API client instance
export const api = new ApiClient({
    baseURL: process.env.REACT_APP_API_URL || '/api',
    cache: {
      enabled: true,
      ttl: 300000 // 5 minutes
    },
    retries: 3,
    timeout: 10000
  });
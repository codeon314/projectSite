import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Switched to hybrid mode to allow static generation for pages, 
// but serverless execution for our new API endpoint.
export default defineConfig({
  output: 'hybrid',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  })
});
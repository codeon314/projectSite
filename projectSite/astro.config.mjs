import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Switch to 'server' output. This ensures the Cloudflare adapter 
// correctly bundles the API endpoint into a _worker.js file.
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  })
});
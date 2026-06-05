import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build
export default defineConfig({
  output: 'server',
  adapter: cloudflare()
});

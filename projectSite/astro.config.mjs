import { defineConfig } from 'astro/config';

// Force clean static build configuration
export default defineConfig({
  output: 'static',
  adapter: undefined
});
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      host: '0.0.0.0',
      port: 8088,
      open: true,
    }
  }
});

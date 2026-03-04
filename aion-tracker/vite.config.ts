import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Change 'aion-enchant-tracker' to your GitHub repo name for GitHub Pages
  base: '/aion-enchant-tracker/',
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Must match the GitHub repository path exactly (case-sensitive on Pages)
  base: '/Aion-Enchant-Tracker/',
});

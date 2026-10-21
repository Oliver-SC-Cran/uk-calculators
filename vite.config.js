import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // The list of files each page needs. scripts/prerender.js reads it to add
    // preload tags to each page, then deletes it so it is not published.
    manifest: true,
  },
})

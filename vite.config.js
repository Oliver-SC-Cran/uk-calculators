import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      // 404.html is what Vercel serves, with a 404 status, for any URL that is
      // not a file or a route listed in vercel.json.
      input: ['index.html', '404.html'],
    },
  },
})

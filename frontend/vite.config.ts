import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // ascolta su 0.0.0.0 (IP locale)
    port: 5173,
  },
})

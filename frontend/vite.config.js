import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // 👈 Forces binding to IPv4
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})

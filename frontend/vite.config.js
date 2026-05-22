import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Proxy: any request to /api/* in dev gets forwarded to Django backend on Render
// This means in React code you just write: axios.get('/api/auth/me/') — no full URL needed
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://resumelens-8u2t.onrender.com',
        changeOrigin: true,
      },
      '/media': {
        target: 'https://resumelens-8u2t.onrender.com',
        changeOrigin: true,
      }
    }
  }
})

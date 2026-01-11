import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// If port 5173 is busy, Vite will automatically try the next available port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false
  }
})

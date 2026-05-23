import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/Components'),
      '@/Components': path.resolve(__dirname, './src/Components'),
      '@/api': path.resolve(__dirname, './src/API'),
      '@/API': path.resolve(__dirname, './src/API'),
    },
  },
  plugins: [
    react(),
  ]
});

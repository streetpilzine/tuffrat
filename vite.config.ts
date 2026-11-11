/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { prerenderMeta } from './scripts/prerender-plugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderMeta()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\/](three|@react-three)[\/]/ },
            { name: 'gsap', test: /node_modules[\/](gsap|@gsap)[\/]/ },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})

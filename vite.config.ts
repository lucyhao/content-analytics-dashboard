import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo-name>/ (also used by `vite preview`); dev stays at the root.
  base: command === 'build' || isPreview ? '/content-analytics-dashboard/' : '/',
}))

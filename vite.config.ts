import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

/**
 * Host-provided externals — supplied by Construct at runtime via window.__CONSTRUCT__.
 * Keep in sync with construct-app/frontend/lib/spaceHost.ts.
 */
const hostExternals = [
  'vue',
  'vue-router',
  'pinia',
  '@vueuse/core',
  '@vueuse/integrations',
  '@tauri-apps/api',
  '@tauri-apps/api/core',
  '@tauri-apps/api/path',
  '@tauri-apps/api/event',
  '@tauri-apps/api/webview',
  '@tauri-apps/plugin-fs',
  '@tauri-apps/plugin-shell',
  '@tauri-apps/plugin-dialog',
  '@tauri-apps/plugin-process',
  'lucide-vue-next',
  'date-fns',
  'dexie',
  'zod',
  '@construct-space/ui',
  '@construct/sdk',
  '@construct-space/sdk',
]

function makeGlobals(externals: string[]): Record<string, string> {
  const globals: Record<string, string> = {}
  for (const ext of externals) {
    if (/^[a-z]+$/.test(ext)) {
      globals[ext] = `window.__CONSTRUCT__.${ext}`
    } else {
      globals[ext] = `window.__CONSTRUCT__["${ext}"]`
    }
  }
  return globals
}

const SPACE_ID = 'pinball'
const SAFE_ID = SPACE_ID.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/entry.ts'),
      name: `__CONSTRUCT_SPACE_${SAFE_ID}`,
      fileName: `space-${SPACE_ID}`,
      formats: ['iife'],
    },
    rollupOptions: {
      external: hostExternals,
      output: {
        globals: makeGlobals(hostExternals),
      },
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname),
      '@': resolve(__dirname, 'src'),
    },
  },
})

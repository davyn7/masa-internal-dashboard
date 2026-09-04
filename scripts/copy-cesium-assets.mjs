import { cpSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

let cesiumRoot
try {
  cesiumRoot = dirname(require.resolve('cesium'))
} catch {
  console.warn('[copy-cesium-assets] cesium not installed; skipping')
  process.exit(0)
}

const source = join(cesiumRoot, 'Build', 'Cesium')
const dest = join(root, 'public', 'cesium')

if (!existsSync(source)) {
  console.warn('[copy-cesium-assets] Build/Cesium not found; skipping')
  process.exit(0)
}

mkdirSync(dest, { recursive: true })

for (const dir of ['Workers', 'ThirdParty', 'Assets', 'Widgets']) {
  cpSync(join(source, dir), join(dest, dir), { recursive: true })
}

console.log('[copy-cesium-assets] Copied Cesium static assets to public/cesium')

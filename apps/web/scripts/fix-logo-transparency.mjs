import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const candidates = [
  'C:/Users/apere/.cursor/projects/d-PROGRAMAS-IA-APRENDIENDOO-JUNTOS/assets/c__Users_apere_AppData_Roaming_Cursor_User_workspaceStorage_e9664c861ffabd3e5852e0cfbeada44a_images_logo_aprendamosjuntos-8083f41e-34d4-4493-a56f-e2e0c6dc66da.png',
  path.join(root, 'public/brand/logo-source.png'),
  path.join(root, 'public/brand/logo.png'),
]

const input = candidates.find((p) => existsSync(p))
if (!input) {
  console.error('No logo source found')
  process.exit(1)
}

const out = path.join(root, 'public/brand/logo.png')

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

for (let i = 0; i < data.length; i += 4) {
  const r = data[i]
  const g = data[i + 1]
  const b = data[i + 2]
  const lum = 0.299 * r + 0.587 * g + 0.114 * b

  if (lum < 35) {
    data[i + 3] = 0
  } else if (lum < 55) {
    data[i + 3] = Math.round(((lum - 35) / 20) * 255)
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(out)

const meta = await sharp(out).metadata()
console.log(`Saved transparent PNG: ${out} (${meta.width}x${meta.height}, alpha=${meta.hasAlpha})`)

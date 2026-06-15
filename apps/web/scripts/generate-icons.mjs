import sharp from 'sharp'
import { mkdir } from 'fs/promises'
import path from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const src = path.join(process.cwd(), 'public', 'brand', 'icon.svg')
const outDir = path.join(process.cwd(), 'public', 'icons')

await mkdir(outDir, { recursive: true })

for (const size of sizes) {
  await sharp(src)
    .resize(size, size)
    .png()
    .toFile(path.join(outDir, `icon-${size}.png`))
}

await sharp(src).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'))
await sharp(src).resize(32, 32).png().toFile(path.join(outDir, 'icon-32.png'))

console.log('Icons generated in public/icons')

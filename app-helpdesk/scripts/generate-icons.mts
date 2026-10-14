import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import sharp from "sharp"

const SRC = "sample-import/logo/logo1.png"

function ico(entries: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(entries.length, 4)

  const dir = Buffer.alloc(16 * entries.length)
  const parts: Buffer[] = []
  let offset = 6 + 16 * entries.length

  entries.forEach((entry, index) => {
    const base = index * 16
    dir.writeUInt8(entry.size, base)
    dir.writeUInt8(entry.size, base + 1)
    dir.writeUInt8(0, base + 2)
    dir.writeUInt8(0, base + 3)
    dir.writeUInt16LE(1, base + 4)
    dir.writeUInt16LE(32, base + 6)
    dir.writeUInt32LE(entry.data.length, base + 8)
    dir.writeUInt32LE(offset, base + 12)
    offset += entry.data.length
    parts.push(entry.data)
  })

  return Buffer.concat([header, dir, ...parts])
}

async function main() {
  const source = readFileSync(SRC)

  mkdirSync("public", { recursive: true })
  writeFileSync("public/logo.png", source)

  const png = (size: number) =>
    sharp(source)
      .resize(size, size, { fit: "cover" })
      .ensureAlpha()
      .png({ compressionLevel: 9 })
      .toBuffer()

  writeFileSync("app/icon.png", await png(192))
  writeFileSync("app/apple-icon.png", await png(180))

  const entries = []
  for (const size of [16, 32, 48]) {
    entries.push({ size, data: await png(size) })
  }
  writeFileSync("app/favicon.ico", ico(entries))

  console.log("logo.png, icon.png, apple-icon.png, favicon.ico ditulis")
}

main()

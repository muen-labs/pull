/**
 * Turn the client's pen into a box the stylist can edit.
 *
 * The client marks a look with freehand red strokes (`LookMarkupDialog`, ink `#b3261e` at 92%).
 * A studio reference needs geometry it can move and redraw, so the strokes are read back off the
 * markup image and reduced to their bounding box — the piece the client actually pointed at.
 */
import type { MarkupRect } from "./types"

/** Read the drawn red out of a markup PNG and return it as one normalised box. */
export async function markupToBbox(markupDataUrl: string, maxSize = 640): Promise<MarkupRect | null> {
  try {
    const source = await load(markupDataUrl)
    const scale = Math.min(1, maxSize / Math.max(source.naturalWidth, source.naturalHeight))
    const width = Math.max(1, Math.round(source.naturalWidth * scale))
    const height = Math.max(1, Math.round(source.naturalHeight * scale))

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d", { willReadFrequently: true })
    if (!context) return null
    context.drawImage(source, 0, 0, width, height)
    const { data } = context.getImageData(0, 0, width, height)

    let minX = width
    let minY = height
    let maxX = -1
    let maxY = -1
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4
        const r = data[index]
        const g = data[index + 1]
        const b = data[index + 2]
        const a = data[index + 3]
        // The marker red, and only the marker red: a photo's own crimson must not qualify.
        if (a > 120 && r > 140 && g < 110 && b < 100 && r - g > 80 && r - b > 90) {
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      }
    }
    if (maxX < 0) return null

    // A little padding so the stylist's redraw starts around the object, not on the line.
    const pad = 0.02
    const x = Math.max(0, minX / width - pad)
    const y = Math.max(0, minY / height - pad)
    const w = Math.min(1 - x, (maxX - minX + 1) / width + pad * 2)
    const h = Math.min(1 - y, (maxY - minY + 1) / height + pad * 2)
    return { x, y, w, h }
  } catch {
    return null
  }
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("could not read the markup"))
    image.src = src
  })
}

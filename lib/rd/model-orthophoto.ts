/** WGS84 lon/lat corner of an orthophoto footprint. */
export type LonLat = [number, number]

export type ModelOrthophotoOverlay = {
  id: string
  name: string
  /** Blob URL for the (possibly downsampled) JPG/PNG (revoked when replaced). */
  imageUrl: string
  /** Southwest corner: [lon, lat]. */
  southwest: LonLat
  /** Northeast corner: [lon, lat]. */
  northeast: LonLat
}

/** Cap GPU texture size to reduce WebGL / tab OOM crashes. */
const MAX_ORTHO_EDGE_PX = 2048

export function parseCoordinate(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return n
}

export function isValidOrthophotoBounds(
  swLon: number,
  swLat: number,
  neLon: number,
  neLat: number,
): boolean {
  if (
    swLon < -180 ||
    swLon > 180 ||
    neLon < -180 ||
    neLon > 180 ||
    swLat < -90 ||
    swLat > 90 ||
    neLat < -90 ||
    neLat > 90
  ) {
    return false
  }
  return neLon > swLon && neLat > swLat
}

/**
 * Decode an orthophoto, downsample if needed, and return a blob URL safe for
 * TextureLoader. Caller must revoke the URL when done.
 */
export async function prepareOrthophotoImageUrl(file: File): Promise<string> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error(
      `Failed to decode orthophoto "${file.name}". Use a valid JPG or PNG.`,
    )
  }

  try {
    const maxEdge = Math.max(bitmap.width, bitmap.height)
    const scale =
      maxEdge > MAX_ORTHO_EDGE_PX ? MAX_ORTHO_EDGE_PX / maxEdge : 1
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to prepare orthophoto (no 2D canvas context).')
    }
    ctx.drawImage(bitmap, 0, 0, width, height)

    const mime =
      file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')
        ? 'image/png'
        : 'image/jpeg'

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result)
          else reject(new Error(`Failed to encode orthophoto "${file.name}".`))
        },
        mime,
        0.85,
      )
    })

    return URL.createObjectURL(blob)
  } finally {
    bitmap.close()
  }
}

export function revokeOrthophotoObjectUrl(url: string | null | undefined) {
  if (!url) return
  try {
    URL.revokeObjectURL(url)
  } catch {
    // Ignore revoke failures for already-revoked URLs.
  }
}

/** Revoke after the WebGL scene has had time to tear down. */
export function revokeOrthophotoObjectUrlsDeferred(
  urls: readonly string[],
  delayMs = 1000,
) {
  if (urls.length === 0) return
  window.setTimeout(() => {
    for (const url of urls) revokeOrthophotoObjectUrl(url)
  }, delayMs)
}

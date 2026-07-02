export type TreemapRect<T> = {
  x: number
  y: number
  w: number
  h: number
  data: T
}

type TreemapItem<T> = { value: number; data: T }

function worst(row: number[], length: number): number {
  if (!row.length) return Infinity
  const sum = row.reduce((a, b) => a + b, 0)
  const max = Math.max(...row)
  const min = Math.min(...row)
  const l2 = length * length
  const s2 = sum * sum
  return Math.max((l2 * max) / s2, s2 / (l2 * min))
}

function layoutRow<T>(
  row: TreemapItem<T>[],
  rect: { x: number; y: number; w: number; h: number },
  horizontal: boolean,
  output: TreemapRect<T>[],
) {
  const sum = row.reduce((acc, item) => acc + item.value, 0)
  if (sum <= 0) return

  if (horizontal) {
    let offset = rect.x
    for (const item of row) {
      const w = (item.value / sum) * rect.w
      output.push({ x: offset, y: rect.y, w, h: rect.h, data: item.data })
      offset += w
    }
  } else {
    let offset = rect.y
    for (const item of row) {
      const h = (item.value / sum) * rect.h
      output.push({ x: rect.x, y: offset, w: rect.w, h, data: item.data })
      offset += h
    }
  }
}

function squarify<T>(
  items: TreemapItem<T>[],
  rect: { x: number; y: number; w: number; h: number },
  output: TreemapRect<T>[],
) {
  if (!items.length || rect.w <= 0 || rect.h <= 0) return

  const total = items.reduce((acc, item) => acc + item.value, 0)
  if (total <= 0) return

  const sorted = [...items].sort((a, b) => b.value - a.value)
  const horizontal = rect.w >= rect.h
  const length = horizontal ? rect.h : rect.w

  let row: TreemapItem<T>[] = []
  let remaining = [...sorted]

  while (remaining.length) {
    const item = remaining[0]
    const nextRow = [...row, item]
    if (
      !row.length ||
      worst(
        nextRow.map((r) => r.value),
        length,
      ) <=
        worst(
          row.map((r) => r.value),
          length,
        )
    ) {
      row = nextRow
      remaining.shift()
    } else {
      const rowSum = row.reduce((acc, r) => acc + r.value, 0)
      if (horizontal) {
        const rowW = (rowSum / total) * rect.w
        layoutRow(row, { x: rect.x, y: rect.y, w: rowW, h: rect.h }, true, output)
        squarify(
          remaining,
          { x: rect.x + rowW, y: rect.y, w: rect.w - rowW, h: rect.h },
          output,
        )
      } else {
        const rowH = (rowSum / total) * rect.h
        layoutRow(row, { x: rect.x, y: rect.y, w: rect.w, h: rowH }, false, output)
        squarify(
          remaining,
          { x: rect.x, y: rect.y + rowH, w: rect.w, h: rect.h - rowH },
          output,
        )
      }
      return
    }
  }

  layoutRow(row, rect, horizontal, output)
}

/** Squarified treemap layout for items with positive values. */
export function layoutTreemap<T>(
  items: TreemapItem<T>[],
  width: number,
  height: number,
): TreemapRect<T>[] {
  const positive = items.filter((item) => item.value > 0)
  const output: TreemapRect<T>[] = []
  squarify(positive, { x: 0, y: 0, w: width, h: height }, output)
  return output
}

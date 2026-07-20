export function MineralBadge({ mineral }: { mineral: string }) {
  return (
    <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
      {mineral}
    </span>
  )
}

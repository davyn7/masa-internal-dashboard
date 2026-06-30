import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function ChartPlaceholder({
  title = 'Add a chart',
  hint = 'This slot is reserved for an upcoming visualization.',
}: {
  title?: string
  hint?: string
}) {
  return (
    <Card className="flex min-h-[300px] flex-col items-center justify-center gap-3 border-2 border-dashed border-border/60 bg-card/30 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-border/70 bg-muted/40 text-muted-foreground">
        <Plus className="size-5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1 px-6">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </Card>
  )
}

'use client'

import { INTERNAL_TRANSACTIONS } from '@/lib/accounts-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const CURRENCY_FORMAT = {
  IDR: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }),
  USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }),
}

function formatCurrency(amount: number, currency: 'IDR' | 'USD'): string {
  return CURRENCY_FORMAT[currency].format(amount)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function InternalTransactionsTable() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Internal Transfers</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">From</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">To</TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {INTERNAL_TRANSACTIONS.map((tx) => (
              <TableRow key={tx.id} className="border-border/40">
                <TableCell className="text-xs font-medium text-foreground">{formatDate(tx.date)}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{tx.from}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{tx.to}</TableCell>
                <TableCell className="text-right text-xs font-medium text-foreground">
                  {formatCurrency(tx.amount, tx.currency)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">{tx.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

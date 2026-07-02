'use client'

import { EXTERNAL_TRANSACTIONS } from '@/lib/accounts-data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'

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

export function ExternalTransactionsTable() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">External Transactions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Account</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Direction</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">External Party</TableHead>
              <TableHead className="text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EXTERNAL_TRANSACTIONS.map((tx) => (
              <TableRow key={tx.id} className="border-border/40">
                <TableCell className="text-xs font-medium text-foreground">{formatDate(tx.date)}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">{tx.account}</TableCell>
                <TableCell className="text-xs">
                  {tx.direction === 'in' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-success">
                      <ArrowDownLeft className="size-3" />
                      <span>Inbound</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-1 text-destructive">
                      <ArrowUpRight className="size-3" />
                      <span>Outbound</span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{tx.externalParty}</TableCell>
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

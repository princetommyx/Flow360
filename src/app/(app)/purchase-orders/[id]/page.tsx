import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailList } from '@/components/shared/detail-list';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatNumber, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { EDITABLE_STATUSES, getPurchaseOrder } from '@/server/services/purchase-orders';

import { ReceivePanel } from './receive-panel';

export const metadata: Metadata = { title: 'Purchase order' };

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('purchases.view');

  const order = await getPurchaseOrder(context.organization.id, id);
  if (!order) notFound();

  const currency = order.currency;
  const can = {
    edit: hasPermission(context.permissions, 'purchases.edit'),
    bill: hasPermission(context.permissions, 'bills.create'),
  };

  const supplierName = order.supplier.companyName ?? order.supplier.name;
  const receivable = ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(
    order.status,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.number}
        description={`Ordered from ${supplierName} on ${formatDate(order.orderDate)}.`}
        meta={<StatusBadge status={order.status} />}
        actions={
          <>
            {can.edit && EDITABLE_STATUSES.includes(order.status) ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/purchase-orders/${order.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            ) : null}
            {can.bill &&
            order.bills.length === 0 &&
            ['PARTIALLY_RECEIVED', 'RECEIVED'].includes(order.status) ? (
              <Button size="sm" asChild>
                <Link href={`/bills/new?purchaseOrderId=${order.id}`}>
                  <ShoppingCart /> Create bill
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Items</CardTitle>
              <CardDescription>
                Received quantities are what has physically arrived so far.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => {
                      const ordered = toNumber(item.quantity);
                      const received = toNumber(item.receivedQuantity);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <p className="text-[13.5px] font-medium">{item.name}</p>
                            {item.description ? (
                              <p className="mt-0.5 text-[12px] text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                            {item.product ? (
                              <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
                                {item.product.sku}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right text-[13px] tabular">
                            {formatNumber(ordered, 0)} {item.unit}
                          </TableCell>
                          <TableCell
                            className={
                              received >= ordered
                                ? 'text-right text-[13px] tabular text-success'
                                : 'text-right text-[13px] tabular text-muted-foreground'
                            }
                          >
                            {formatNumber(received, 0)}
                          </TableCell>
                          <TableCell className="text-right text-[13px] tabular">
                            {formatCurrency(toNumber(item.unitPrice), { currency })}
                          </TableCell>
                          <TableCell className="text-right text-[13px] font-medium tabular">
                            {formatCurrency(toNumber(item.lineTotal), { currency })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />

              <dl className="ml-auto max-w-xs space-y-2 text-[13.5px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular">
                    {formatCurrency(toNumber(order.subtotal), { currency })}
                  </dd>
                </div>
                {toNumber(order.discountAmount) > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Supplier discount</dt>
                    <dd className="tabular">
                      − {formatCurrency(toNumber(order.discountAmount), { currency })}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="tabular">
                    {formatCurrency(toNumber(order.taxAmount), { currency })}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-4">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-[15px] font-semibold tabular">
                    {formatCurrency(toNumber(order.total), { currency })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {can.edit && receivable ? (
            <ReceivePanel
              purchaseOrderId={order.id}
              lines={order.items.map((item) => ({
                id: item.id,
                name: item.name,
                unit: item.unit,
                ordered: toNumber(item.quantity),
                received: toNumber(item.receivedQuantity),
                tracked: Boolean(item.productId),
              }))}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Name', value: supplierName },
                  { label: 'Email', value: order.supplier.email ?? '—' },
                  { label: 'Phone', value: order.supplier.phone ?? '—' },
                  {
                    label: 'Address',
                    value:
                      [
                        order.supplier.addressLine1,
                        order.supplier.city,
                        order.supplier.country,
                      ]
                        .filter(Boolean)
                        .join(', ') || '—',
                  },
                ]}
              />
              <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
                <Link href={`/suppliers/${order.supplier.id}`}>View supplier</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Order</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Ordered', value: formatDate(order.orderDate) },
                  {
                    label: 'Expected',
                    value: order.expectedDate ? formatDate(order.expectedDate) : '—',
                  },
                  {
                    label: 'Fully received',
                    value: order.receivedAt ? formatDate(order.receivedAt) : '—',
                  },
                  { label: 'Currency', value: order.currency },
                ]}
              />
            </CardContent>
          </Card>

          {order.bills.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Bills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.bills.map((bill) => (
                  <Link
                    key={bill.id}
                    href={`/bills/${bill.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <span className="font-mono text-[12.5px]">{bill.number}</span>
                    <span className="flex items-center gap-2">
                      <StatusBadge status={bill.status} size="sm" />
                      <span className="text-[13px] font-medium tabular">
                        {formatCurrency(toNumber(bill.total), { currency })}
                      </span>
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {order.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

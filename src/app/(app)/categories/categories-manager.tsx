'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/shared/empty-state';
import { FormStatus } from '@/components/shared/form-status';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/server/actions/products';
import {
  productCategorySchema,
  type ProductCategoryInput,
} from '@/lib/validations/product';

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  productCount: number;
};

export function CategoriesManager({
  categories,
  can,
}: {
  categories: CategoryRow[];
  can: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<CategoryRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const confirm = useConfirm<CategoryRow>();

  const form = useForm<ProductCategoryInput>({
    resolver: zodResolver(productCategorySchema),
    defaultValues: { name: '', description: '' },
  });

  const open = creating || editing !== null;

  function startCreate() {
    setError(null);
    setEditing(null);
    form.reset({ name: '', description: '' });
    setCreating(true);
  }

  function startEdit(category: CategoryRow) {
    setError(null);
    setCreating(false);
    form.reset({ name: category.name, description: category.description ?? '' });
    setEditing(category);
  }

  function close() {
    setCreating(false);
    setEditing(null);
    setError(null);
  }

  async function onSubmit(values: ProductCategoryInput) {
    setError(null);
    const result = editing
      ? await updateCategoryAction(editing.id, values)
      : await createCategoryAction(values);

    if (!result.ok) {
      setError(result.error);
      if (result.field === 'name') form.setError('name', { message: result.error });
      return;
    }

    toast.success(editing ? 'Category updated' : 'Category added');
    close();
    router.refresh();
  }

  async function remove(category: CategoryRow) {
    const result = await deleteCategoryAction(category.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${category.name} removed`);
    router.refresh();
  }

  return (
    <>
      {can.create ? (
        <div className="flex justify-end">
          <Button size="sm" onClick={startCreate}>
            <Plus /> Add category
          </Button>
        </div>
      ) : null}

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Group your catalogue so quoting is faster and reports break down the way you think about the business."
            action={
              can.create ? (
                <Button size="sm" onClick={startCreate}>
                  Add your first category
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="flex flex-col p-5 hover-lift">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-[14.5px] font-semibold tracking-[-0.01em]">
                    {category.name}
                  </h2>
                  <Badge variant="neutral" size="sm" className="mt-1.5">
                    {category.productCount} product
                    {category.productCount === 1 ? '' : 's'}
                  </Badge>
                </div>
                {can.edit || can.delete ? (
                  <RowActions
                    label={`Actions for ${category.name}`}
                    actions={[
                      ...(can.edit
                        ? [
                            {
                              label: 'Rename',
                              icon: Pencil,
                              onSelect: () => startEdit(category),
                            },
                          ]
                        : []),
                      {
                        label: 'View products',
                        icon: Package,
                        href: `/products?categoryId=${category.id}`,
                      },
                      ...(can.delete
                        ? [
                            {
                              label: 'Remove',
                              icon: Trash2,
                              destructive: true,
                              separatorBefore: true,
                              onSelect: () => confirm.ask(category),
                            },
                          ]
                        : []),
                    ]}
                  />
                ) : null}
              </div>

              <p className="mt-3 flex-1 text-pretty text-[13px] leading-relaxed text-muted-foreground">
                {category.description ?? 'No description.'}
              </p>

              <Link
                href={`/products?categoryId=${category.id}`}
                className="mt-4 text-[13px] font-medium text-primary hover:underline"
              >
                View products
              </Link>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={(next) => (next ? undefined : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Rename category' : 'Add category'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Products already in this category keep their assignment.'
                : 'Categories group products for quoting, filtering and reporting.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <DialogBody className="grid gap-4">
                <FormStatus error={error} />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Workstations" autoFocus {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Desks, benches and height-adjustable frames"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={close}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting}>
                  {editing ? 'Save changes' : 'Add category'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Remove this category?"
        destructive
        confirmLabel="Remove category"
        description={
          <>
            <strong className="text-foreground">{confirm.target?.name}</strong> will be
            removed. Categories still in use cannot be deleted — move those products
            first.
          </>
        }
        onConfirm={() => (confirm.target ? remove(confirm.target) : undefined)}
      />
    </>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Lock, Pencil, Plus, Trash2, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import { deleteRoleAction, saveRoleAction } from '@/server/actions/settings';
import { roleSchema, type RoleInput } from '@/lib/validations/settings';
import type { RoleRow } from '@/server/services/settings';

import { PermissionMatrix } from './permission-matrix';

function RoleDialog({
  role,
  open,
  onOpenChange,
  readOnly,
}: {
  role: RoleRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<RoleInput>({
    resolver: zodResolver(roleSchema),
    defaultValues: role
      ? { name: role.name, description: role.description, permissions: role.permissions }
      : { name: '', description: '', permissions: [] },
  });

  async function submit(values: RoleInput) {
    setError(null);
    const result = await runAction(() =>
      saveRoleAction(values, role ? { id: role.id } : undefined),
    );

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof RoleInput, { message: result.error });
      }
      return;
    }

    toast.success(role ? `${values.name} updated` : `${values.name} created`);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {readOnly ? role?.name : role ? `Edit ${role.name}` : 'Create a role'}
          </DialogTitle>
          <DialogDescription>
            {readOnly
              ? 'The owner role is fixed, so a workspace can always be recovered by the person who opened it.'
              : 'Tick what this role may do. Anything left unticked is refused on the server, not merely hidden.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            <DialogBody className="grid gap-5">
              <FormStatus error={error} />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Warehouse" disabled={readOnly} {...field} />
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
                      <FormLabel>What it is for</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          disabled={readOnly}
                          placeholder="Receives stock and picks orders."
                          {...field}
                          value={String(field.value ?? '')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Controller
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <PermissionMatrix
                    value={field.value}
                    onChange={field.onChange}
                    disabled={readOnly}
                  />
                )}
              />
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                {readOnly ? 'Close' : 'Cancel'}
              </Button>
              {readOnly ? null : (
                <Button type="submit" loading={form.formState.isSubmitting}>
                  {role ? 'Save role' : 'Create role'}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function RolesManager({
  roles,
  canCreate,
  canEdit,
  canDelete,
}: {
  roles: RoleRow[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<RoleRow | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<RoleRow | null>(null);

  function open(role: RoleRow | null) {
    setEditing(role);
    setDialogOpen(true);
  }

  async function remove() {
    if (!removing) return;
    const result = await runAction(() => deleteRoleAction(removing.id));

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${removing.name} deleted`);
    setRemoving(null);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-[14px]">
            {roles.length} {roles.length === 1 ? 'role' : 'roles'}
          </CardTitle>
          <CardDescription>
            Built-in roles can be tuned to how you work. The owner role is fixed.
          </CardDescription>
        </div>
        {canCreate ? (
          <Button size="sm" onClick={() => open(null)}>
            <Plus /> New role
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2">
          {roles.map((role) => {
            const locked = role.key === 'owner';

            return (
              <li
                key={role.id}
                className="flex flex-col justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-semibold">{role.name}</span>
                    {role.isSystem ? (
                      <Badge variant="outline" size="sm">
                        Built in
                      </Badge>
                    ) : null}
                    {locked ? (
                      <Badge variant="neutral" size="sm" className="gap-1">
                        <Lock className="size-3" aria-hidden /> Fixed
                      </Badge>
                    ) : null}
                  </div>
                  {role.description ? (
                    <p className="mt-1.5 text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
                      {role.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      <span className="tabular">{role.memberCount}</span>
                    </span>
                    <span className="tabular">
                      {role.permissions.length} permissions
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => open(role)}
                      aria-label={
                        canEdit && !locked
                          ? `Edit ${role.name}`
                          : `View ${role.name} permissions`
                      }
                    >
                      <Pencil />
                      {canEdit && !locked ? 'Edit' : 'View'}
                    </Button>
                    {canDelete && !role.isSystem ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${role.name}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setRemoving(role)}
                      >
                        <Trash2 />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>

      {dialogOpen ? (
        <RoleDialog
          key={editing?.id ?? 'new'}
          role={editing}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          readOnly={!canEdit || editing?.key === 'owner'}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(next) => !next && setRemoving(null)}
        title={`Delete the ${removing?.name ?? ''} role?`}
        description="Anyone still holding it would lose their access, so the role has to be empty before it can go."
        confirmLabel="Delete role"
        destructive
        onConfirm={remove}
      />
    </Card>
  );
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormStatus } from '@/components/shared/form-status';
import { runAction } from '@/lib/client-action';
import { inviteMemberAction } from '@/server/actions/settings';
import {
  inviteMemberSchema,
  type InviteMemberInput,
} from '@/lib/validations/settings';

export type RoleOption = { id: string; name: string; description: string };

export function InviteDialog({
  roles,
  open,
  onOpenChange,
  emailIsLive,
}: {
  roles: RoleOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailIsLive: boolean;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    // No role is preselected. The first one in the list is the most powerful,
    // and a dialog that grants administrator to anyone who taps through it is
    // exactly the mistake this page exists to prevent.
    defaultValues: { name: '', email: '', roleId: '', jobTitle: '' },
  });

  async function submit(values: InviteMemberInput) {
    setError(null);
    const result = await runAction(() => inviteMemberAction(values));

    if (!result.ok) {
      setError(result.error);
      if (result.field && result.field in values) {
        form.setError(result.field as keyof InviteMemberInput, {
          message: result.error,
        });
      }
      return;
    }

    if (!result.data.emailed) {
      toast.warning(
        `${values.name} was added, but the email did not go out. Send the invitation again once email is working.`,
      );
    } else if (result.data.joinedImmediately) {
      toast.success(
        `${values.name} already has an account, so they are in the workspace now.`,
      );
    } else {
      toast.success(`Invitation sent to ${values.email}`);
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
          <DialogDescription>
            They get an email with a link. Nothing happens in the workspace until they
            use it.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} noValidate>
            <DialogBody className="grid gap-4">
              <FormStatus error={error} />

              {emailIsLive ? null : (
                <Alert variant="warning">
                  <AlertDescription>
                    Email delivery is not configured on this deployment, so the
                    invitation will be recorded but not sent. You would need to pass the
                    link on another way.
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Their name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ama Owusu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="ama@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is the address they will sign in with.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job title</FormLabel>
                    <FormControl>
                      <Input placeholder="Sales executive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {roles.find((role) => role.id === field.value)?.description ??
                        'What they can see and change. It can be changed later.'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

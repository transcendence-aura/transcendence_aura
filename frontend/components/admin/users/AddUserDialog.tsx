'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Dialog } from '@/components/ui/overlay/dialog';
import { Input } from '@/components/ui/form/input';
import { Button } from '@/components/ui/form/button';
import { useToast } from '@/components/ui/feedback/toast';
import { REGISTER_USER, GET_ADMIN_USERS } from '@/lib/graphql/queries/admin-users';

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_FORM = { name: '', handle: '', email: '', password: '' };

export function AddUserDialog({ isOpen, onClose }: AddUserDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);

  const [registerUser, { loading }] = useMutation(REGISTER_USER, {
    refetchQueries: [GET_ADMIN_USERS],
    onCompleted: () => {
      toast({ message: 'User created', variant: 'success' });
      setForm(EMPTY_FORM);
      onClose();
    },
    onError: () => {
      toast({ message: 'Failed to create user', variant: 'error' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerUser({ variables: { input: form } });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add user"
      description="Creates a new account with the User role."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          placeholder="Handle"
          value={form.handle}
          onChange={(e) => setForm({ ...form, handle: e.target.value })}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <Input
          type="password"
          placeholder="Temporary password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          minLength={8}
          required
        />

        <div className="mt-2 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create user'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

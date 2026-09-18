'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { Input } from '@/components/ui/form/input';
import { Switch } from '@/components/ui/form/switch';
import { useToast } from '@/components/ui/feedback/toast';
import {
  GET_ADMIN_PRODUCTS,
  ADMIN_UPDATE_PRODUCT_VARIANT,
  ADMIN_DELETE_PRODUCT_VARIANT,
  type ProductVariant,
} from '@/lib/graphql/queries/admin-products';

export function VariantRow({
  variant,
  onDeleted,
  onRequestDelete,
}: {
  variant: ProductVariant;
  onDeleted: () => void;
  onRequestDelete: (confirmDelete: () => void) => void;
}) {
  const { toast } = useToast();
  const [label, setLabel] = useState(variant.label);
  const [price, setPrice] = useState(String(variant.price));
  const [isAvailable, setIsAvailable] = useState(variant.isAvailable);
  const [dirty, setDirty] = useState(false);

  const [updateVariant, { loading: saving }] = useMutation(ADMIN_UPDATE_PRODUCT_VARIANT, {
    refetchQueries: [GET_ADMIN_PRODUCTS],
    onCompleted: () => {
      toast({ message: 'Variant updated', variant: 'success' });
      setDirty(false);
    },
    onError: () => {
      toast({ message: 'Failed to update variant', variant: 'error' });
    },
  });

  const [deleteVariant, { loading: deleting }] = useMutation(ADMIN_DELETE_PRODUCT_VARIANT, {
    refetchQueries: [GET_ADMIN_PRODUCTS],
    onCompleted: () => {
      toast({ message: 'Variant removed', variant: 'success' });
      onDeleted();
    },
    onError: () => {
      toast({ message: 'Failed to remove variant', variant: 'error' });
    },
  });

  const markDirty =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setDirty(true);
    };

  return (
    <div className="border-border-default flex flex-wrap items-center gap-3 border-b py-3 last:border-b-0">
      <Input
        value={label}
        onChange={(e) => markDirty(setLabel)(e.target.value)}
        placeholder="Size (e.g. 50ml)"
        className="w-32"
      />
      <Input
        type="number"
        min={0}
        step="0.01"
        value={price}
        onChange={(e) => markDirty(setPrice)(e.target.value)}
        placeholder="Price"
        className="w-24"
      />
      <label className="text-body-sm text-text-secondary flex items-center gap-2">
        <Switch
          checked={isAvailable}
          onChange={(e) => markDirty(setIsAvailable)(e.target.checked)}
        />
        Available
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() =>
            updateVariant({
              variables: {
                variantId: variant.id,
                input: { label, price: Number(price), isAvailable },
              },
            })
          }
          className="text-ui-button text-text-primary border-border-default hover:bg-page border px-3 py-2 uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() =>
            onRequestDelete(() => deleteVariant({ variables: { variantId: variant.id } }))
          }
          aria-label="Remove variant"
          className="text-status-error hover:bg-page flex h-9 w-9 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { Input } from '@/components/ui/form/input';
import { Switch } from '@/components/ui/form/switch';
import { useToast } from '@/components/ui/feedback/toast';
import { parsePriceInput } from '@/lib/parse-price';
import { getValidationErrorMessage } from '@/lib/graphql-error';
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
  // Collapsed by default - a saved variant rarely needs another look once it's already set up, and
  // with Collection/Category/Product Family now also in this dialog, a list of already-created
  // variants each showing their full edit row at once made the form long to scan.
  const [expanded, setExpanded] = useState(false);
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
    onError: (error) => {
      toast({
        message: getValidationErrorMessage(error) ?? 'Failed to update variant',
        variant: 'error',
      });
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

  const requestDelete = () =>
    onRequestDelete(() => deleteVariant({ variables: { variantId: variant.id } }));

  if (!expanded) {
    // Reads local state, not the `variant` prop: a successful Save only updates state here (see
    // updateVariant's onCompleted below) - it doesn't flow back up to activeProduct in
    // ProductFormDialog, so `variant` itself stays stale after an edit. Collapsing right after a
    // save would otherwise show the pre-edit values despite the save having worked.
    const displayPrice = parsePriceInput(price) ?? variant.price;

    return (
      <div className="border-border-default flex items-center gap-3 border-b py-1 last:border-b-0">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="hover:bg-page flex flex-1 items-center gap-3 py-2 text-start transition-colors"
        >
          <ChevronRight className="text-text-muted h-4 w-4 shrink-0" />
          <span className="text-body-sm text-text-primary font-medium">{label}</span>
          <span className="text-body-sm text-text-muted">€{displayPrice.toFixed(2)}</span>
          <span
            className={`text-ui-caption uppercase ${
              isAvailable ? 'text-status-online' : 'text-status-error'
            }`}
          >
            {isAvailable ? 'Available' : 'Unavailable'}
          </span>
          {dirty && (
            <span className="text-status-error text-ui-caption uppercase">Unsaved changes</span>
          )}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={requestDelete}
          aria-label="Remove variant"
          className="text-status-error hover:bg-page flex h-9 w-9 shrink-0 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-border-default flex flex-wrap items-center gap-3 border-b py-3 last:border-b-0">
      <button
        type="button"
        onClick={() => setExpanded(false)}
        aria-label="Collapse variant"
        className="text-text-muted hover:text-text-primary flex h-9 w-9 shrink-0 items-center justify-center"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <Input
        value={label}
        onChange={(e) => markDirty(setLabel)(e.target.value)}
        placeholder="Size (e.g. 50ml)"
        className="w-32"
      />
      <Input
        type="text"
        inputMode="decimal"
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

      <div className="ml-auto flex items-center gap-3">
        {dirty && <span className="text-status-error text-body-sm">Unsaved changes</span>}
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => {
            const parsedPrice = parsePriceInput(price);
            if (parsedPrice === null) {
              toast({ message: 'Enter a valid, non-negative price', variant: 'error' });
              return;
            }
            updateVariant({
              variables: {
                variantId: variant.id,
                input: { label, price: parsedPrice, isAvailable },
              },
            });
          }}
          className="text-ui-button text-text-primary border-border-default hover:bg-page border px-3 py-2 uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={requestDelete}
          aria-label="Remove variant"
          className="text-status-error hover:bg-page flex h-9 w-9 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { ChevronDown, ChevronRight, Star, Trash2 } from 'lucide-react';
import { Dialog } from '@/components/ui/overlay/dialog';
import { Input } from '@/components/ui/form/input';
import { Textarea } from '@/components/ui/form/textarea';
import { Button } from '@/components/ui/form/button';
import { useToast } from '@/components/ui/feedback/toast';
import { ConfirmActionDialog } from '@/components/admin/ConfirmActionDialog';
import { VariantRow } from './VariantRow';
import { uploadProductImage } from '@/lib/upload-product-image';
import { parsePriceInput } from '@/lib/parse-price';
import { getValidationErrorMessage } from '@/lib/graphql-error';
import {
  GET_ADMIN_PRODUCTS,
  ADMIN_CREATE_PRODUCT,
  ADMIN_UPDATE_PRODUCT,
  ADMIN_DELETE_PRODUCT,
  ADMIN_HARD_DELETE_PRODUCT,
  ADMIN_ADD_PRODUCT_VARIANT,
  ADMIN_SET_PRIMARY_PRODUCT_IMAGE,
  ADMIN_DELETE_PRODUCT_IMAGE,
  type AdminProduct,
  type AdminCategory,
  type AdminProductFamily,
  type AdminCollection,
  type AdminCreateProductResponse,
  type AdminUpdateProductResponse,
  type AdminDeactivateProductResponse,
  type AdminAddProductVariantResponse,
  type AdminSetPrimaryProductImageResponse,
  type AdminDeleteProductImageResponse,
} from '@/lib/graphql/queries/admin-products';

// Order doesn't carry meaning for any of the id lists compared below (checking two boxes in a
// different order than they were saved in isn't a real change), so a plain array `!==` would flag
// false positives - compare as sets instead.
function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

// Collection/Category/Product Family all render the exact same "checkbox list behind a
// collapsible header" shape, just with a different label/option set/selection - factored out
// instead of repeating it 3x. Closed by default (same reasoning as VariantRow: with all three of
// these plus everything else in the form, showing every checkbox at once made the dialog long to
// scan) but still shows what's currently selected as a one-line summary, so collapsed doesn't mean
// invisible.
function CollapsibleCheckboxGroup({
  label,
  options,
  selectedIds,
  onToggle,
}: {
  label: string;
  options: { id: string; name: string }[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedNames = options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.name);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="text-ui-label text-text-muted mb-1 flex w-full items-center justify-between uppercase tracking-widest"
      >
        <span>
          {label}
          {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
        </span>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {!expanded && selectedNames.length > 0 && (
        <p className="text-body-sm text-text-secondary">{selectedNames.join(', ')}</p>
      )}

      {expanded && (
        <div className="flex flex-wrap gap-3 pt-1">
          {options.map((option) => (
            <label
              key={option.id}
              className="text-body-sm text-text-secondary flex items-center gap-2"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => onToggle(option.id)}
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// Mirrors the backend's BadRequestException messages from
// admin-product-image.controller.ts / image-validation.util.ts.
const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  IMAGE_TYPE_NOT_ALLOWED: 'Only JPEG images are allowed.',
  IMAGE_MUST_BE_SQUARE: 'Image must be square (equal width and height).',
  IMAGE_FILE_REQUIRED: 'Please select an image file.',
};

interface ProductFormDialogProps {
  isOpen: boolean;
  product: AdminProduct | null;
  categories: AdminCategory[];
  productFamilies: AdminProductFamily[];
  collections: AdminCollection[];
  onClose: () => void;
}

export function ProductFormDialog({
  isOpen,
  product,
  categories,
  productFamilies,
  collections,
  onClose,
}: ProductFormDialogProps) {
  const { toast } = useToast();
  const client = useApolloClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeProduct, setActiveProduct] = useState<AdminProduct | null>(product);
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryIds, setCategoryIds] = useState<string[]>(
    product?.categories.map((c) => c.id) ?? [],
  );
  const [productFamilyIds, setProductFamilyIds] = useState<string[]>(
    product?.productFamilies.map((f) => f.id) ?? [],
  );
  const [collectionIds, setCollectionIds] = useState<string[]>(
    product?.collections.map((c) => c.id) ?? [],
  );
  const [badges, setBadges] = useState<string[]>(product?.badges ?? []);
  const [newBadge, setNewBadge] = useState('');
  const [newVariantLabel, setNewVariantLabel] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const [createProduct, { loading: creating }] = useMutation<AdminCreateProductResponse>(
    ADMIN_CREATE_PRODUCT,
    {
      refetchQueries: [GET_ADMIN_PRODUCTS],
      onCompleted: (data) => {
        setActiveProduct(data.adminCreateProduct);
        toast({ message: 'Product created — add variants and images below', variant: 'success' });
      },
      onError: () => toast({ message: 'Failed to create product', variant: 'error' }),
    },
  );

  const [updateProduct, { loading: updating }] = useMutation<AdminUpdateProductResponse>(
    ADMIN_UPDATE_PRODUCT,
    {
      refetchQueries: [GET_ADMIN_PRODUCTS],
      onCompleted: (data) => {
        setActiveProduct(data.adminUpdateProduct);
        toast({ message: 'Product saved', variant: 'success' });
      },
      onError: () => toast({ message: 'Failed to save product', variant: 'error' }),
    },
  );

  const [publishProduct, { loading: publishing }] = useMutation<AdminUpdateProductResponse>(
    ADMIN_UPDATE_PRODUCT,
    {
      refetchQueries: [GET_ADMIN_PRODUCTS],
      onCompleted: (data) => {
        setActiveProduct(data.adminUpdateProduct);
        toast({ message: 'Product published', variant: 'success' });
      },
      onError: () => toast({ message: 'Failed to publish product', variant: 'error' }),
    },
  );

  const [deactivateProduct, { loading: deactivating }] =
    useMutation<AdminDeactivateProductResponse>(ADMIN_DELETE_PRODUCT, {
      refetchQueries: [GET_ADMIN_PRODUCTS],
      onCompleted: (data) => {
        setActiveProduct(data.adminDeleteProduct);
        toast({ message: 'Product deactivated', variant: 'success' });
      },
      onError: () => toast({ message: 'Failed to deactivate product', variant: 'error' }),
    });

  const [hardDeleteProduct, { loading: hardDeleting }] = useMutation(ADMIN_HARD_DELETE_PRODUCT, {
    refetchQueries: [GET_ADMIN_PRODUCTS],
    onCompleted: () => {
      toast({ message: 'Product permanently deleted', variant: 'success' });
      onClose();
    },
    onError: () => toast({ message: 'Failed to delete product', variant: 'error' }),
  });

  const [addVariant, { loading: addingVariant }] = useMutation<AdminAddProductVariantResponse>(
    ADMIN_ADD_PRODUCT_VARIANT,
    {
      refetchQueries: [GET_ADMIN_PRODUCTS],
      onCompleted: (data) => {
        setActiveProduct((prev) =>
          prev ? { ...prev, variants: [...prev.variants, data.adminAddProductVariant] } : prev,
        );
        setNewVariantLabel('');
        setNewVariantPrice('');
        toast({ message: 'Variant added', variant: 'success' });
      },
      onError: (error) =>
        toast({
          message: getValidationErrorMessage(error) ?? 'Failed to add variant',
          variant: 'error',
        }),
    },
  );

  const [setPrimaryImage] = useMutation<AdminSetPrimaryProductImageResponse>(
    ADMIN_SET_PRIMARY_PRODUCT_IMAGE,
    {
      onCompleted: (data) => {
        setActiveProduct(data.adminSetPrimaryProductImage);
      },
      onError: () => toast({ message: 'Failed to set primary image', variant: 'error' }),
    },
  );

  const [deleteImage] = useMutation<AdminDeleteProductImageResponse>(ADMIN_DELETE_PRODUCT_IMAGE, {
    onCompleted: (data) => {
      setActiveProduct(data.adminDeleteProductImage);
      toast({ message: 'Image removed', variant: 'success' });
    },
    onError: () => toast({ message: 'Failed to remove image', variant: 'error' }),
  });

  const toggleCategory = (id: string) => {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleProductFamily = (id: string) => {
    setProductFamilyIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const toggleCollection = (id: string) => {
    setCollectionIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const addBadge = () => {
    const trimmed = newBadge.trim();
    if (!trimmed || badges.includes(trimmed)) return;
    setBadges((prev) => [...prev, trimmed]);
    setNewBadge('');
  };

  const removeBadge = (badge: string) => {
    setBadges((prev) => prev.filter((b) => b !== badge));
  };

  const handleSaveBaseFields = () => {
    const input = {
      name,
      description,
      categoryIds,
      productFamilyIds,
      collectionIds,
      badges,
    };
    if (activeProduct) {
      updateProduct({ variables: { id: activeProduct.id, input } });
    } else {
      createProduct({ variables: { input } });
    }
  };

  // Unlike the image (saved immediately on upload, see handleUpload), none of these fields persist
  // until "Save Product" is clicked - easy to miss, since the two save behaviors sit right next to
  // each other in the same dialog. Compares the form's current state against what's actually on
  // activeProduct (the last-saved snapshot) to surface that instead of staying silent about it.
  const hasUnsavedChanges =
    name !== (activeProduct?.name ?? '') ||
    description !== (activeProduct?.description ?? '') ||
    !sameIds(categoryIds, activeProduct?.categories.map((c) => c.id) ?? []) ||
    !sameIds(productFamilyIds, activeProduct?.productFamilies.map((f) => f.id) ?? []) ||
    !sameIds(collectionIds, activeProduct?.collections.map((c) => c.id) ?? []) ||
    !sameIds(badges, activeProduct?.badges ?? []);

  const handlePublish = () => {
    if (!activeProduct) return;
    publishProduct({ variables: { id: activeProduct.id, input: { isActive: true } } });
  };

  const handleUpload = async (file: File) => {
    if (!activeProduct) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const media = await uploadProductImage({
        productId: activeProduct.id,
        file,
        onProgress: setUploadProgress,
      });
      setActiveProduct((prev) => (prev ? { ...prev, media: [...prev.media, media] } : prev));
      // uploadProductImage is a raw XHR, not a GraphQL mutation - its result never reaches
      // Apollo's cache on its own, so the admin list stays stale (missing image) until something
      // else happens to refetch it. Explicit refetch here, same as every other mutation in this
      // file already does via `refetchQueries`.
      void client.refetchQueries({ include: [GET_ADMIN_PRODUCTS] });
      toast({ message: 'Image uploaded', variant: 'success' });
    } catch (error) {
      const code = error instanceof Error ? error.message : undefined;
      toast({
        message: UPLOAD_ERROR_MESSAGES[code ?? ''] ?? 'Image upload failed',
        variant: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  // The backend fills in a synthetic "placeholder" media entry (non-UUID id,
  // pointing at a placehold.co image) when a product has no real image yet -
  // fine for read-only display elsewhere (ProductCard), but set-primary/
  // delete would 400 on its non-UUID id, so it's excluded from this list.
  const realImages = activeProduct?.media.filter((image) => image.id !== 'placeholder') ?? [];

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={activeProduct ? 'Edit Product' : 'Add Product'}
      >
        <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto pr-1">
          <section className="flex flex-col gap-4">
            <div>
              <label className="text-ui-label text-text-muted mb-1 block uppercase tracking-widest">
                Name *
              </label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <CollapsibleCheckboxGroup
              label="Collection"
              options={collections}
              selectedIds={collectionIds}
              onToggle={toggleCollection}
            />

            <CollapsibleCheckboxGroup
              label="Category"
              options={categories}
              selectedIds={categoryIds}
              onToggle={toggleCategory}
            />

            <CollapsibleCheckboxGroup
              label="Product Family"
              options={productFamilies}
              selectedIds={productFamilyIds}
              onToggle={toggleProductFamily}
            />

            <div>
              <label className="text-ui-label text-text-muted mb-1 block uppercase tracking-widest">
                Badges
              </label>
              <div className="mb-2 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="bg-page border-border-default text-text-secondary inline-flex items-center gap-1.5 border px-2 py-1 text-ui-label"
                  >
                    {badge}
                    <button
                      type="button"
                      onClick={() => removeBadge(badge)}
                      aria-label={`Remove badge ${badge}`}
                      className="text-text-muted hover:text-status-error"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBadge();
                    }
                  }}
                  placeholder="e.g. Bestseller"
                  maxLength={50}
                  className="w-40"
                />
                <Button variant="ghost" onClick={addBadge} disabled={!newBadge.trim()}>
                  + Add Badge
                </Button>
              </div>
            </div>

            <div>
              <label className="text-ui-label text-text-muted mb-1 block uppercase tracking-widest">
                Description
              </label>
              <Textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              {hasUnsavedChanges && !creating && !updating && (
                <span className="text-status-error text-body-sm">Unsaved changes</span>
              )}
              <Button
                onClick={handleSaveBaseFields}
                disabled={!name.trim() || creating || updating}
              >
                {creating || updating ? 'Saving...' : 'Save Product'}
              </Button>
            </div>
          </section>

          {activeProduct && (
            <section className="border-border-default border-t pt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-display-subtitle font-semibold uppercase">Images</h3>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Image'}
                </Button>
              </div>

              {uploading && (
                <div className="bg-border-default mb-3 h-1 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-brand-dark h-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {realImages.map((image) => (
                  <div key={image.id} className="relative h-20 w-20 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.altText ?? activeProduct.name}
                      className="h-full w-full border border-border-default object-cover"
                    />
                    <button
                      type="button"
                      aria-label="Set as primary image"
                      onClick={() =>
                        setPrimaryImage({
                          variables: { productId: activeProduct.id, imageId: image.id },
                        })
                      }
                      className={`absolute top-1 left-1 flex h-5 w-5 items-center justify-center rounded-full ${
                        image.isPrimary
                          ? 'bg-brand-dark text-text-inverse'
                          : 'bg-card text-text-muted'
                      }`}
                    >
                      <Star className="h-3 w-3" fill={image.isPrimary ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete image"
                      onClick={() =>
                        setConfirmDelete({
                          title: 'Delete image',
                          description: 'This image will be permanently removed. Continue?',
                          confirmLabel: 'Delete',
                          onConfirm: () =>
                            deleteImage({
                              variables: { productId: activeProduct.id, imageId: image.id },
                            }),
                        })
                      }
                      className="bg-card text-status-error absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {realImages.length === 0 && (
                  <p className="text-body-sm text-text-muted">No images yet.</p>
                )}
              </div>
            </section>
          )}

          {activeProduct && (
            <section className="border-border-default border-t pt-6">
              <h3 className="text-display-subtitle mb-3 font-semibold uppercase">Variants</h3>

              {activeProduct.variants.map((v) => (
                <VariantRow
                  key={v.id}
                  variant={v}
                  onDeleted={() =>
                    setActiveProduct((prev) =>
                      prev
                        ? { ...prev, variants: prev.variants.filter((x) => x.id !== v.id) }
                        : prev,
                    )
                  }
                  onRequestDelete={(confirm) =>
                    setConfirmDelete({
                      title: 'Remove variant',
                      description: `Remove "${v.label}"? This cannot be undone.`,
                      confirmLabel: 'Delete',
                      onConfirm: confirm,
                    })
                  }
                />
              ))}

              <div className="flex items-center gap-3 pt-3">
                <Input
                  placeholder="Size (e.g. 50ml)"
                  value={newVariantLabel}
                  onChange={(e) => setNewVariantLabel(e.target.value)}
                  className="w-32"
                />
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Price"
                  value={newVariantPrice}
                  onChange={(e) => setNewVariantPrice(e.target.value)}
                  className="w-24"
                />
                <Button
                  variant="ghost"
                  disabled={!newVariantLabel.trim() || !newVariantPrice || addingVariant}
                  onClick={() => {
                    const parsedPrice = parsePriceInput(newVariantPrice);
                    if (parsedPrice === null) {
                      toast({ message: 'Enter a valid, non-negative price', variant: 'error' });
                      return;
                    }
                    addVariant({
                      variables: {
                        productId: activeProduct.id,
                        input: { label: newVariantLabel, price: parsedPrice },
                      },
                    });
                  }}
                >
                  + Add Variant
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border-default pt-6">
                <div>
                  <p className="text-body-base text-text-primary font-medium">Publish</p>
                  <p className="text-body-sm text-text-muted">
                    {activeProduct.isActive
                      ? 'This product is live in the storefront.'
                      : activeProduct.variants.length > 0
                        ? 'Makes this product visible in the storefront.'
                        : 'Add at least one variant before publishing.'}
                  </p>
                </div>
                <Button
                  variant="affirmative"
                  disabled={
                    activeProduct.variants.length === 0 || publishing || activeProduct.isActive
                  }
                  onClick={handlePublish}
                >
                  {activeProduct.isActive
                    ? 'Published ✓'
                    : publishing
                      ? 'Publishing...'
                      : 'Publish Product'}
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border-default pt-6">
                <button
                  type="button"
                  disabled={deactivating || !activeProduct.isActive}
                  onClick={() =>
                    setConfirmDelete({
                      title: 'Deactivate product',
                      description: `${activeProduct.name} will be deactivated and hidden from the storefront. This can be undone by publishing it again. Continue?`,
                      confirmLabel: 'Deactivate',
                      onConfirm: () => deactivateProduct({ variables: { id: activeProduct.id } }),
                    })
                  }
                  className="text-ui-button text-status-error uppercase transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Deactivate Product
                </button>
                <button
                  type="button"
                  disabled={hardDeleting}
                  onClick={() =>
                    setConfirmDelete({
                      title: 'Delete product permanently',
                      description: `${activeProduct.name} and everything under it (images, variants) will be permanently deleted from the database. This cannot be undone.`,
                      confirmLabel: 'Delete Permanently',
                      onConfirm: () => hardDeleteProduct({ variables: { id: activeProduct.id } }),
                    })
                  }
                  className="text-ui-button bg-status-error text-text-inverse px-4 py-2 uppercase transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete Permanently
                </button>
              </div>
            </section>
          )}
        </div>
      </Dialog>

      <ConfirmActionDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          confirmDelete?.onConfirm();
          setConfirmDelete(null);
        }}
        title={confirmDelete?.title ?? ''}
        description={confirmDelete?.description ?? ''}
        confirmLabel={confirmDelete?.confirmLabel ?? 'Delete'}
      />
    </>
  );
}

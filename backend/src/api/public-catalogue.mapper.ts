import { CollectionsType } from '../modules/collections/collection.model';
import { PublicCategory } from '../modules/categories/category.service';
import { ProductType } from '../modules/products/product.model';
import {
  PublicCategoryDto,
  PublicCollectionDto,
  PublicProductDto,
} from './dto/public-catalogue.dto';

function toReference({ id, slug, name }: { id: string; slug: string; name: string }) {
  return { id, slug, name };
}

export function toPublicProduct(p: ProductType): PublicProductDto {
  const availablePrices = p.variants.filter((v) => v.isAvailable).map((v) => v.price);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    badges: p.badges,
    primaryImage: p.primaryImage,
    minPrice: availablePrices.length > 0 ? Math.min(...availablePrices) : undefined,
    media: p.media,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      isAvailable: v.isAvailable,
      price: v.price,
      isOnSale: v.isOnSale,
      discountPercentage: v.discountPercentage,
    })),
    categories: p.categories.map(toReference),
    productFamilies: p.productFamilies.map(toReference),
    collections: p.collections.map(toReference),
  };
}

export function toPublicCollection(c: CollectionsType): PublicCollectionDto {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    heroImageUrl: c.heroImageUrl,
    categories: c.categories,
  };
}

export function toPublicCategory(c: PublicCategory): PublicCategoryDto {
  return { ...c };
}

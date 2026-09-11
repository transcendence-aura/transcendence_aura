import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { slugify } from '../../common/utils/slugify';
import { ProductsService } from '../products/product.service';
import { ProductType, ProductVariantType } from '../products/product.model';
import {
  AdminCreateProductInput,
  AdminCreateProductVariantInput,
  AdminUpdateProductInput,
  AdminUpdateProductVariantInput,
} from './admin-product.input';

const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

function mapVariant(variant: {
  id: string;
  label: string;
  isAvailable: boolean;
  price: Prisma.Decimal;
  isOnSale: boolean;
  discountPercentage: Prisma.Decimal;
}): ProductVariantType {
  return {
    ...variant,
    price: variant.price.toNumber(),
    discountPercentage: variant.discountPercentage.toNumber(),
  };
}

@Injectable()
export class AdminProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
  ) {}

  private async assertRelationsExist(input: {
    categoryIds?: string[];
    productFamilyIds?: string[];
    collectionIds?: string[];
  }): Promise<void> {
    if (input.categoryIds && input.categoryIds.length > 0) {
      const count = await this.prisma.category.count({
        where: { id: { in: input.categoryIds } },
      });
      if (count !== new Set(input.categoryIds).size) {
        throw new NotFoundException('CATEGORY_NOT_FOUND');
      }
    }

    if (input.productFamilyIds && input.productFamilyIds.length > 0) {
      const count = await this.prisma.productFamily.count({
        where: { id: { in: input.productFamilyIds } },
      });
      if (count !== new Set(input.productFamilyIds).size) {
        throw new NotFoundException('PRODUCT_FAMILY_NOT_FOUND');
      }
    }

    if (input.collectionIds && input.collectionIds.length > 0) {
      const count = await this.prisma.collection.count({
        where: { id: { in: input.collectionIds } },
      });
      if (count !== new Set(input.collectionIds).size) {
        throw new NotFoundException('COLLECTION_NOT_FOUND');
      }
    }
  }

  private async generateUniqueSlug(name: string, excludeProductId?: string): Promise<string> {
    const base = slugify(name);
    if (!base) {
      throw new BadRequestException('PRODUCT_NAME_INVALID');
    }

    let candidate = base;
    let suffix = 2;
    while (await this.slugTaken(candidate, excludeProductId)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async slugTaken(slug: string, excludeProductId?: string): Promise<boolean> {
    const existing = await this.prisma.product.findFirst({
      where: { slug, ...(excludeProductId ? { id: { not: excludeProductId } } : {}) },
      select: { id: true },
    });
    return existing !== null;
  }

  async createProduct(input: AdminCreateProductInput): Promise<ProductType> {
    await this.assertRelationsExist(input);
    const slug = await this.generateUniqueSlug(input.name);

    try {
      const created = await this.prisma.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          badges: input.badges ?? [],
          isActive: input.isActive ?? true,
          categories: input.categoryIds
            ? { connect: input.categoryIds.map((id) => ({ id })) }
            : undefined,
          productFamilies: input.productFamilyIds
            ? { connect: input.productFamilyIds.map((id) => ({ id })) }
            : undefined,
          collections: input.collectionIds
            ? { connect: input.collectionIds.map((id) => ({ id })) }
            : undefined,
        },
        select: { id: true },
      });

      return await this.productsService.findById(created.id);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException('PRODUCT_SLUG_TAKEN');
      }
      throw error;
    }
  }

  async updateProduct(id: string, input: AdminUpdateProductInput): Promise<ProductType> {
    const current = await this.getProductOrThrow(id);
    await this.assertRelationsExist(input);

    const nameChanged = input.name !== undefined && input.name !== current.name;
    const slug = nameChanged ? await this.generateUniqueSlug(input.name!, id) : undefined;

    try {
      await this.prisma.product.update({
        where: { id },
        data: {
          name: input.name,
          slug,
          description: input.description,
          badges: input.badges,
          isActive: input.isActive,
          categories: input.categoryIds
            ? { set: input.categoryIds.map((catId) => ({ id: catId })) }
            : undefined,
          productFamilies: input.productFamilyIds
            ? { set: input.productFamilyIds.map((famId) => ({ id: famId })) }
            : undefined,
          collections: input.collectionIds
            ? { set: input.collectionIds.map((colId) => ({ id: colId })) }
            : undefined,
        },
      });

      return await this.productsService.findById(id);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException('PRODUCT_SLUG_TAKEN');
      }
      throw error;
    }
  }

  // Soft delete: hides the product from catalog/search (ProductsService
  // filters on isActive) without touching variants, media or wishlists -
  // wishlist entries keep pointing at a real (just inactive) product, so
  // nothing is left dangling and the action stays reversible via edit.
  async deleteProduct(id: string): Promise<ProductType> {
    await this.getProductOrThrow(id);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return this.productsService.findById(id);
  }

  async addVariant(
    productId: string,
    input: AdminCreateProductVariantInput,
  ): Promise<ProductVariantType> {
    await this.getProductOrThrow(productId);

    try {
      const variant = await this.prisma.productVariant.create({
        data: {
          productId,
          label: input.label,
          price: input.price,
          isAvailable: input.isAvailable ?? true,
          isOnSale: input.isOnSale ?? false,
          discountPercentage: input.discountPercentage ?? 0,
        },
      });

      return mapVariant(variant);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException('VARIANT_LABEL_TAKEN');
      }
      throw error;
    }
  }

  async updateVariant(
    variantId: string,
    input: AdminUpdateProductVariantInput,
  ): Promise<ProductVariantType> {
    await this.assertVariantExists(variantId);

    try {
      const variant = await this.prisma.productVariant.update({
        where: { id: variantId },
        data: {
          label: input.label,
          price: input.price,
          isAvailable: input.isAvailable,
          isOnSale: input.isOnSale,
          discountPercentage: input.discountPercentage,
        },
      });

      return mapVariant(variant);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException('VARIANT_LABEL_TAKEN');
      }
      throw error;
    }
  }

  async deleteVariant(variantId: string): Promise<boolean> {
    await this.assertVariantExists(variantId);

    await this.prisma.productVariant.delete({ where: { id: variantId } });
    return true;
  }

  private async getProductOrThrow(id: string): Promise<{ id: string; name: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }
    return product;
  }

  private async assertVariantExists(id: string): Promise<void> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!variant) {
      throw new NotFoundException('VARIANT_NOT_FOUND');
    }
  }
}

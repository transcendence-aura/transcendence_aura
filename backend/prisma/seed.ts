import path from 'node:path';
import dotenv from 'dotenv';
import { NotificationType, PrismaClient, UserRole, UserStatus } from '@prisma/client';

import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
});

const databaseUrl = process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error('POSTGRES_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({ adapter });
const DEFAULT_PASSWORD = 'SecurePassword!';

const ids = {
  users: {
    admin: '00000000-0000-4000-8000-000000000001',
    clara: '00000000-0000-4000-8000-000000000002',
    marie: '00000000-0000-4000-8000-000000000003',
    sophie: '00000000-0000-4000-8000-000000000004',
  },
  collections: {
    skincare: '10000000-0000-4000-8000-000000000001',
    haircare: '10000000-0000-4000-8000-000000000002',
  },
  products: {
    cleanser: '20000000-0000-4000-8000-000000000001',
    conditioner: '20000000-0000-4000-8000-000000000002',
    faceoil: '20000000-0000-4000-8000-000000000003',
    moisturizer: '20000000-0000-4000-8000-000000000004',
    serum: '20000000-0000-4000-8000-000000000005',
    shampoo: '20000000-0000-4000-8000-000000000006',
  },
  variants: {
    cleanser100ml: '30000000-0000-4000-8000-000000000001',
    cleanser200ml: '30000000-0000-4000-8000-000000000002',
    conditioner150ml: '30000000-0000-4000-8000-000000000003',
    faceoil50ml: '30000000-0000-4000-8000-000000000004',
    moisturizer100ml: '30000000-0000-4000-8000-000000000005',
    serum30ml: '30000000-0000-4000-8000-000000000006',
    shampoo200ml: '30000000-0000-4000-8000-000000000007',
  },
  conversations: {
    marieAndSophie: '40000000-0000-4000-8000-000000000001',
    marieAndClara: '40000000-0000-4000-8000-000000000002',
  },
  messages: {
    message1: '50000000-0000-4000-8000-000000000001',
    message2: '50000000-0000-4000-8000-000000000002',
    message3: '50000000-0000-4000-8000-000000000003',
    message4: '50000000-0000-4000-8000-000000000004',
  },
  notifications: {
    follow: '60000000-0000-4000-8000-000000000001',
    message: '60000000-0000-4000-8000-000000000002',
    wishlist: '60000000-0000-4000-8000-000000000003',
    system: '60000000-0000-4000-8000-000000000004',
  },
  analytics: {
    followCreated: '70000000-0000-4000-8000-000000000001',
    messageSent: '70000000-0000-4000-8000-000000000002',
    wishlistAdded: '70000000-0000-4000-8000-000000000003',
  },
  media: {
    cleanser1: '80000000-0000-4000-8000-000000000001',
    cleanser2: '80000000-0000-4000-8000-000000000002',
    conditioner1: '80000000-0000-4000-8000-000000000003',
    faceoil1: '80000000-0000-4000-8000-000000000004',
    faceoil2: '80000000-0000-4000-8000-000000000005',
    moisturizer1: '80000000-0000-4000-8000-000000000006',
    serum1: '80000000-0000-4000-8000-000000000007',
    serum2: '80000000-0000-4000-8000-000000000008',
    shampoo1: '80000000-0000-4000-8000-000000000009',
  },
} as const;

const seedDates = {
  accountCreated: new Date('2026-07-29T09:00:00.000Z'),
  followCreated: new Date('2026-07-29T10:00:00.000Z'),
  wishlistCreated: new Date('2026-07-29T11:00:00.000Z'),
  conversationCreated: new Date('2026-07-29T12:00:00.000Z'),
  message1: new Date('2026-07-29T12:01:00.000Z'),
  message2: new Date('2026-07-29T12:05:00.000Z'),
  message3: new Date('2026-07-29T13:45:00.000Z'),
  message4: new Date('2026-07-29T14:00:00.000Z'),
  notificationCreated: new Date('2026-07-29T15:00:00.000Z'),
  analyticsOccurred: new Date('2026-07-29T16:00:00.000Z'),
} as const;

async function seedUsers(passwordHash: string): Promise<void> {
  const users = [
    {
      id: ids.users.admin,
      name: 'Aura Administrator',
      email: 'admin@example.com',
      handle: 'admin',
      bio: 'Admin account for local development',
      passwordHash: DEFAULT_PASSWORD,
      role: UserRole.ADMIN,
    },
    {
      id: ids.users.clara,
      name: 'Clara L',
      email: 'clara@example.com',
      handle: 'clara',
      bio: 'Skincare enthusiast',
      passwordHash: DEFAULT_PASSWORD,
      role: UserRole.USER,
    },
    {
      id: ids.users.marie,
      name: 'Marie Laurent',
      email: 'marie@example.com',
      handle: 'marielaurent',
      bio: 'Clean beauty enthusiast - sensitive skin',
      passwordHash: DEFAULT_PASSWORD,
      role: UserRole.USER,
    },
    {
      id: ids.users.sophie,
      name: 'Sophie B',
      email: 'sophie@example.com',
      handle: 'sophieb',
      bio: 'Minimalist beauty and skincare advocate',
      passwordHash: DEFAULT_PASSWORD,
      role: UserRole.USER,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        handle: user.handle,
        bio: user.bio,
        passwordHash,
        role: user.role,
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      create: {
        ...user,
        passwordHash,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: seedDates.accountCreated,
        createdAt: seedDates.accountCreated,
      },
    });
  }
}

async function seedCollections(): Promise<void> {
  const collections = [
    {
      id: ids.collections.skincare,
      name: 'Clean Beauty Skincare',
      slug: 'clean-beauty-skincare',
      heroImageUrl: 'https://placehold.co/1500x200?text=Collection-Skincare',
      description: 'Gentle products designed for your everyday skincare routine.',
    },
    {
      id: ids.collections.haircare,
      name: 'Botanical Hair Care',
      slug: 'botanical-hair-care',
      heroImageUrl: 'https://placehold.co/1500x200?text=Collection-Haircare',
      description: 'Clean, botanical hair solutions.',
    },
  ];

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { id: collection.id },
      update: {
        name: collection.name,
        slug: collection.slug,
        heroImageUrl: collection.heroImageUrl,
        description: collection.description,
        isActive: true,
      },
      create: {
        ...collection,
        isActive: true,
        createdAt: seedDates.accountCreated,
      },
    });
  }
}

async function seedProducts(): Promise<void> {
  const products = [
    {
      id: ids.products.cleanser,
      name: 'Purifying Gel Cleanser',
      slug: 'purifying-gel-cleanser',
      description: 'A sulfate-free gel cleanser that gently removes impurities.',
      collectionIds: [ids.collections.skincare],
    },
    {
      id: ids.products.conditioner,
      name: 'Restorative Hair Conditioner',
      slug: 'restorative-hair-conditioner',
      description: 'A silicone-free conditioner made with botanical oils.',
      collectionIds: [ids.collections.haircare],
    },
    {
      id: ids.products.faceoil,
      name: 'Rosehip Face Oil',
      slug: 'rosehip-face-oil',
      description: 'An antioxidant rich oil that restores natural glow.',
      collectionIds: [ids.collections.skincare],
    },
    {
      id: ids.products.moisturizer,
      name: 'Barrier Repair Cream',
      slug: 'barrier-repair-cream',
      description: 'A ceramide-rich moisturizer formulated to strengthen the skin barrier.',
      collectionIds: [ids.collections.skincare],
    },
    {
      id: ids.products.serum,
      name: 'Vitamin C Serum',
      slug: 'vitamin-c-serum',
      description: 'A lightweight serum with stabilized Vitamin C and niacinamide.',
      collectionIds: [ids.collections.skincare],
    },
    {
      id: ids.products.shampoo,
      name: 'Balancing Daily Shampoo',
      slug: 'balancing-daily-shampoo',
      description: 'A gentle, sulfate-free shampoo.',
      collectionIds: [ids.collections.haircare],
    },
  ];

  for (const product of products) {
    const collectionConnections = product.collectionIds.map((id) => ({ id }));

    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        isActive: true,
        collections: {
          set: collectionConnections,
        },
      },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        isActive: true,
        createdAt: seedDates.accountCreated,
        collections: {
          connect: collectionConnections,
        },
      },
    });
  }
}

async function seedProductVariants(): Promise<void> {
  const variants = [
    {
      id: ids.variants.cleanser100ml,
      price: 42,
      productId: ids.products.cleanser,
      label: '100 ml',
      isAvailable: true,
    },
    {
      id: ids.variants.cleanser200ml,
      productId: ids.products.cleanser,
      price: 84,
      label: '200 ml',
      isAvailable: true,
    },
    {
      id: ids.variants.conditioner150ml,
      productId: ids.products.conditioner,
      price: 21,
      label: '150 ml',
      isAvailable: true,
    },
    {
      id: ids.variants.faceoil50ml,
      productId: ids.products.faceoil,
      price: 21,
      label: '50 ml',
      isAvailable: true,
    },
    {
      id: ids.variants.moisturizer100ml,
      productId: ids.products.moisturizer,
      price: 30.99,
      label: '100 ml',
      isAvailable: true,
    },
    {
      id: ids.variants.serum30ml,
      productId: ids.products.serum,
      price: 12.42,
      label: '30 ml',
      isAvailable: true,
    },
    {
      id: ids.variants.shampoo200ml,
      productId: ids.products.shampoo,
      price: 21.42,
      label: '200 ml',
      isAvailable: true,
    },
  ];

  for (const variant of variants) {
    await prisma.productVariant.upsert({
      where: {
        productId_label: {
          productId: variant.productId,
          label: variant.label,
        },
      },
      update: {
        isAvailable: variant.isAvailable,
        price: variant.price,
      },
      create: variant,
    });
  }
}

async function seedMedia(): Promise<void> {
  const mediaItems = [
    {
      id: ids.media.cleanser1,
      productId: ids.products.cleanser,
      url: 'https://placehold.co/800x800?text=Cleanser+Front',
      altText: 'Purifying Gel Cleanser - front view',
      mimeType: 'image/jpeg',
      position: 0,
    },
    {
      id: ids.media.cleanser2,
      productId: ids.products.cleanser,
      url: 'https://placehold.co/800x800?text=Cleanser+Detail',
      altText: 'Purifying Gel Cleanser - texture detail',
      mimeType: 'image/jpeg',
      position: 1,
    },
    {
      id: ids.media.conditioner1,
      productId: ids.products.conditioner,
      url: 'https://placehold.co/800x800?text=Conditioner+Front',
      altText: 'Restorative Hair Conditioner - front view',
      mimeType: 'image/jpeg',
      position: 0,
    },
    {
      id: ids.media.faceoil1,
      productId: ids.products.faceoil,
      url: 'https://placehold.co/800x800?text=Face+Oil+Front',
      altText: 'Rosehip Face Oil - front view',
      mimeType: 'image/jpeg',
      position: 0,
    },
    {
      id: ids.media.faceoil2,
      productId: ids.products.faceoil,
      url: 'https://placehold.co/800x800?text=Face+Oil+Dropper',
      altText: 'Rosehip Face Oil - dropper detail',
      mimeType: 'image/jpeg',
      position: 1,
    },
    {
      id: ids.media.moisturizer1,
      productId: ids.products.moisturizer,
      url: 'https://placehold.co/800x800?text=Moisturizer+Front',
      altText: 'Barrier Repair Cream - front view',
      mimeType: 'image/jpeg',
      position: 0,
    },
    {
      id: ids.media.serum1,
      productId: ids.products.serum,
      url: 'https://placehold.co/800x800?text=Serum+Front',
      altText: 'Vitamin C Serum - front view',
      mimeType: 'image/jpeg',
      position: 0,
    },
    {
      id: ids.media.serum2,
      productId: ids.products.serum,
      url: 'https://placehold.co/800x800?text=Serum+Texture',
      altText: 'Vitamin C Serum - texture',
      mimeType: 'image/jpeg',
      position: 1,
    },
    {
      id: ids.media.shampoo1,
      productId: ids.products.shampoo,
      url: 'https://placehold.co/800x800?text=Shampoo+Front',
      altText: 'Balancing Daily Shampoo - front view',
      mimeType: 'image/jpeg',
      position: 0,
    },
  ];

  for (const item of mediaItems) {
    await prisma.media.upsert({
      where: { id: item.id },
      update: {
        url: item.url,
        altText: item.altText,
        mimeType: item.mimeType,
        position: item.position,
      },
      create: item,
    });
  }
}

async function seedWishlists(): Promise<void> {
  const wishlistItems = [
    {
      userId: ids.users.marie,
      productId: ids.products.serum,
    },
    {
      userId: ids.users.marie,
      productId: ids.products.moisturizer,
    },
    {
      userId: ids.users.sophie,
      productId: ids.products.shampoo,
    },
    {
      userId: ids.users.sophie,
      productId: ids.products.faceoil,
    },
    {
      userId: ids.users.clara,
      productId: ids.products.cleanser,
    },
    {
      userId: ids.users.clara,
      productId: ids.products.conditioner,
    },
  ];

  for (const item of wishlistItems) {
    await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId: item.userId,
          productId: item.productId,
        },
      },
      update: {},
      create: {
        ...item,
        createdAt: seedDates.wishlistCreated,
      },
    });
  }
}

async function seedFollows(): Promise<void> {
  const follows = [
    {
      followerId: ids.users.marie,
      followingId: ids.users.sophie,
    },
    {
      followerId: ids.users.sophie,
      followingId: ids.users.marie,
    },
    {
      followerId: ids.users.clara,
      followingId: ids.users.marie,
    },
    {
      followerId: ids.users.marie,
      followingId: ids.users.clara,
    },
  ];

  for (const follow of follows) {
    await prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId: follow.followerId,
          followingId: follow.followingId,
        },
      },
      update: {},
      create: {
        ...follow,
        createdAt: seedDates.followCreated,
      },
    });
  }
}

async function seedConversations(): Promise<void> {
  const conversations = [
    {
      id: ids.conversations.marieAndClara,
      userOneId: ids.users.marie,
      userTwoId: ids.users.clara,
    },
    {
      id: ids.conversations.marieAndSophie,
      userOneId: ids.users.marie,
      userTwoId: ids.users.sophie,
    },
  ];

  for (const conversation of conversations) {
    await prisma.conversation.upsert({
      where: {
        userOneId_userTwoId: {
          userOneId: conversation.userOneId,
          userTwoId: conversation.userTwoId,
        },
      },
      update: {
        userOneDeletedAt: null,
        userTwoDeletedAt: null,
      },
      create: {
        ...conversation,
        createdAt: seedDates.conversationCreated,
      },
    });
  }
}

async function seedMessages(): Promise<void> {
  const messages = [
    {
      id: ids.messages.message1,
      conversationId: ids.conversations.marieAndClara,
      senderId: ids.users.marie,
      content: 'Hey! Have you tried the Rosehip Face Oil?',
      createdAt: seedDates.message1,
    },
    {
      id: ids.messages.message2,
      conversationId: ids.conversations.marieAndClara,
      senderId: ids.users.clara,
      content: 'Not yet, is it heavy?',
      createdAt: seedDates.message2,
    },
    {
      id: ids.messages.message3,
      conversationId: ids.conversations.marieAndSophie,
      senderId: ids.users.sophie,
      content: 'Would you recommend the Barrier Repair Cream?',
      createdAt: seedDates.message3,
    },
    {
      id: ids.messages.message4,
      conversationId: ids.conversations.marieAndSophie,
      senderId: ids.users.marie,
      content: 'Yes! It absorbs quickly.',
      createdAt: seedDates.message4,
    },
  ];

  for (const message of messages) {
    await prisma.message.upsert({
      where: { id: message.id },
      update: {
        senderId: message.senderId,
        conversationId: message.conversationId,
        content: message.content,
        createdAt: message.createdAt,
      },
      create: message,
    });
  }
}

async function seedNotifications(): Promise<void> {
  const notifications = [
    {
      id: ids.notifications.follow,
      type: NotificationType.FOLLOW,
      userId: ids.users.marie,
      actorId: ids.users.sophie,
      title: 'New follower',
      body: 'Sophie B started following you.',
    },
    {
      id: ids.notifications.message,
      type: NotificationType.MESSAGE,
      userId: ids.users.marie,
      actorId: ids.users.sophie,
      title: 'New message',
      body: 'Sophie B sent you a message.',
    },
    {
      id: ids.notifications.wishlist,
      type: NotificationType.WISHLIST,
      userId: ids.users.sophie,
      actorId: null,
      title: 'Wishlist update',
      body: 'Your wishlist has been updated.',
    },
    {
      id: ids.notifications.system,
      type: NotificationType.SYSTEM,
      userId: ids.users.clara,
      actorId: null,
      title: 'Welcome',
      body: 'Welcome to the Aura community!',
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {
        type: notification.type,
        userId: notification.userId,
        actorId: notification.actorId,
        title: notification.title,
        body: notification.body,
        readAt: null,
        createdAt: seedDates.notificationCreated,
      },
      create: {
        ...notification,
        readAt: null,
        createdAt: seedDates.notificationCreated,
      },
    });
  }
}

async function seedAnalyticsEvents(): Promise<void> {
  const events = [
    {
      id: ids.analytics.wishlistAdded,
      eventType: 'wishlist_item_added',
      actorId: ids.users.marie,
      targetType: 'product',
      targetId: ids.products.serum,
    },
    {
      id: ids.analytics.followCreated,
      eventType: 'user_followed',
      actorId: ids.users.sophie,
      targetType: 'user',
      targetId: ids.users.marie,
    },
    {
      id: ids.analytics.messageSent,
      eventType: 'message_sent',
      actorId: ids.users.marie,
      targetType: 'conversation',
      targetId: ids.conversations.marieAndSophie,
    },
  ];

  for (const event of events) {
    await prisma.analyticsEvent.upsert({
      where: { id: event.id },
      update: {
        eventType: event.eventType,
        actorId: event.actorId,
        targetType: event.targetType,
        targetId: event.targetId,
        occurredAt: seedDates.analyticsOccurred,
      },
      create: {
        ...event,
        occurredAt: seedDates.analyticsOccurred,
      },
    });
  }
}

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  await seedUsers(passwordHash);
  await seedCollections();
  await seedProducts();
  await seedProductVariants();
  await seedMedia();
  await seedWishlists();
  await seedFollows();
  await seedConversations();
  await seedMessages();
  await seedNotifications();
  await seedAnalyticsEvents();
}

async function run(): Promise<void> {
  try {
    await main();
  } catch (error: unknown) {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(`Database seed failed: ${message}\n`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void run();

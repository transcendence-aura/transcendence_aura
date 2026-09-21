import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationService } from './notification.service';
import { NotificationActorType, NotificationType } from './notification.model';
import { MarkNotificationReadInput } from './notification.input';

@Resolver(() => NotificationType)
@UseGuards(RolesGuard)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => [NotificationType])
  notifications(
    @CurrentUser() userId: string,
    @Args('unreadOnly', { type: () => Boolean, nullable: true }) unreadOnly?: boolean,
  ): Promise<NotificationType[]> {
    return this.notificationService.list(userId, unreadOnly);
  }

  @Mutation(() => NotificationType)
  markNotificationRead(
    @CurrentUser() userId: string,
    @Args('input') input: MarkNotificationReadInput,
  ): Promise<NotificationType> {
    return this.notificationService.markRead(userId, input.notificationId);
  }

  @Mutation(() => Int)
  markAllNotificationsRead(@CurrentUser() userId: string): Promise<number> {
    return this.notificationService.markAllRead(userId);
  }

  @ResolveField(() => NotificationActorType, { nullable: true })
  actor(@Parent() notification: NotificationType): Promise<{ id: string; name: string } | null> {
    if (!notification.actorId) return Promise.resolve(null);
    return this.notificationService.getActor(notification.actorId);
  }
}

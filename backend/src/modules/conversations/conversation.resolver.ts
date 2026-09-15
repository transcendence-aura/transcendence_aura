import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConversationService } from './conversation.service';
import { ConversationType, MessageType } from './conversation.model';
import { RespondToConversationInput, SendMessageInput } from './conversation.input';

@Resolver()
@UseGuards(GqlAuthGuard)
export class ConversationResolver {
  constructor(private readonly conversationService: ConversationService) {}

  @Query(() => ConversationType)
  conversation(
    @CurrentUser() userId: string,
    @Args('otherUserId') otherUserId: string,
  ): Promise<ConversationType> {
    return this.conversationService.findOrCreateConversation(userId, otherUserId);
  }

  @Query(() => [MessageType])
  messages(
    @CurrentUser() userId: string,
    @Args('conversationId') conversationId: string,
  ): Promise<MessageType[]> {
    return this.conversationService.getMessages(userId, conversationId);
  }

  @Query(() => [ConversationType])
  pendingConversations(@CurrentUser() userId: string): Promise<ConversationType[]> {
    return this.conversationService.listPendingConversations(userId);
  }

  @Mutation(() => MessageType)
  sendMessage(
    @CurrentUser() userId: string,
    @Args('input') input: SendMessageInput,
  ): Promise<MessageType> {
    return this.conversationService.sendMessage(userId, input);
  }

  @Mutation(() => ConversationType)
  acceptConversation(
    @CurrentUser() userId: string,
    @Args('input') input: RespondToConversationInput,
  ): Promise<ConversationType> {
    return this.conversationService.acceptConversation(userId, input.conversationId);
  }

  @Mutation(() => ConversationType)
  declineConversation(
    @CurrentUser() userId: string,
    @Args('input') input: RespondToConversationInput,
  ): Promise<ConversationType> {
    return this.conversationService.declineConversation(userId, input.conversationId);
  }
}

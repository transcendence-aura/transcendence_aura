import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConversationService } from './conversation.service';
import { ConversationParticipantType, ConversationType, MessageType } from './conversation.model';
import {
  RespondToConversationInput,
  SendMessageInput,
  StartConversationInput,
} from './conversation.input';

@Resolver(() => ConversationType)
@UseGuards(RolesGuard)
export class ConversationResolver {
  constructor(private readonly conversationService: ConversationService) {}

  @Query(() => ConversationType, { nullable: true })
  conversation(
    @CurrentUser() userId: string,
    @Args('otherUserId') otherUserId: string,
  ): Promise<ConversationType | null> {
    return this.conversationService.getConversation(userId, otherUserId);
  }

  @Mutation(() => ConversationType)
  startConversation(
    @CurrentUser() userId: string,
    @Args('input') input: StartConversationInput,
  ): Promise<ConversationType> {
    return this.conversationService.startConversation(userId, input.otherUserId);
  }

  @Query(() => [MessageType])
  messages(
    @CurrentUser() userId: string,
    @Args('conversationId') conversationId: string,
  ): Promise<MessageType[]> {
    return this.conversationService.getMessages(userId, conversationId);
  }

  @Query(() => [ConversationType])
  conversations(@CurrentUser() userId: string): Promise<ConversationType[]> {
    return this.conversationService.listConversations(userId);
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

  @ResolveField(() => ConversationParticipantType)
  userOne(@Parent() conversation: ConversationType): Promise<ConversationParticipantType> {
    return this.conversationService.getParticipant(conversation.userOneId);
  }

  @ResolveField(() => ConversationParticipantType)
  userTwo(@Parent() conversation: ConversationType): Promise<ConversationParticipantType> {
    return this.conversationService.getParticipant(conversation.userTwoId);
  }
}

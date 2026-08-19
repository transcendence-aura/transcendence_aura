import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConversationService } from './conversation.service';
import { ConversationType, MessageType } from './conversation.model';
import { SendMessageInput } from './conversation.input';

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

  @Mutation(() => MessageType)
  sendMessage(
    @CurrentUser() userId: string,
    @Args('input') input: SendMessageInput,
  ): Promise<MessageType> {
    return this.conversationService.sendMessage(userId, input);
  }
}

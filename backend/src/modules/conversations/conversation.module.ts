import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConversationResolver } from './conversation.resolver';
import { ConversationService } from './conversation.service';

@Module({
  imports: [AuthModule],
  providers: [ConversationResolver, ConversationService],
})
export class ConversationModule {}

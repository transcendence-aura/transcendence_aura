import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { UserType } from './auth.model';

@Resolver(() => UserType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => UserType)
  register(@Args('input') dto: RegisterDto): Promise<UserType> {
    return this.authService.register(dto);
  }
}

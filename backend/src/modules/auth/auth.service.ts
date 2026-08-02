import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;
const PRISMA_UNIQUE_CONSTRAINT_ERROR = 'P2002';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          handle: dto.handle,
          passwordHash,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR
      ) {
        throw new ConflictException('USERNAME_TAKEN');
      }
      throw error;
    }
  }
}

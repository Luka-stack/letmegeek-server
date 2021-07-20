import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    TypeOrmModule.forFeature([CommentsRepository]),
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
})
export class CommentsModule {}
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UserStatsModule } from './user-stats/user-stats.module';

@Module({
  imports: [
    ConfigModule,
    UserStatsModule,
    TypeOrmModule.forFeature([UsersRepository]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [TypeOrmModule],
})
export class UsersModule {}

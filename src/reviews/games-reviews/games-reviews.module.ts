import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { GamesModule } from '../../games/games.module';
import { GamesReviewsService } from './games-reviews.service';
import { GamesReviewsController } from './games-reviews.controller';
import { GamesReviewsRepository } from './games-reviews.repository';

@Module({
  imports: [
    AuthModule,
    GamesModule,
    TypeOrmModule.forFeature([GamesReviewsRepository]),
  ],
  providers: [GamesReviewsService],
  controllers: [GamesReviewsController],
})
export class GamesReviewsModule {}

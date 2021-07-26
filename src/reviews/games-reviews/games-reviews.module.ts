import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { GamesModule } from '../../games/games.module';
import { GamesReviewsService } from './games-reviews.service';
import { GamesReviewsController } from './games-reviews.controller';
import { GamesReviewsRepository } from './games-reviews.repository';
import { WallsGamesModule } from '../../walls/walls-games/walls-games.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    GamesModule,
    ConfigModule,
    WallsGamesModule,
    TypeOrmModule.forFeature([GamesReviewsRepository]),
  ],
  providers: [GamesReviewsService],
  controllers: [GamesReviewsController],
})
export class GamesReviewsModule {}

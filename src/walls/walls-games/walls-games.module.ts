import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../../auth/auth.module';
import { GamesModule } from '../../games/games.module';
import { WallsGamesService } from './walls-games.service';
import { WallsGamesController } from './walls-games.controller';
import { WallsGamesRepository } from './walls-games.repository';

@Module({
  imports: [
    AuthModule,
    GamesModule,
    TypeOrmModule.forFeature([WallsGamesRepository]),
  ],
  controllers: [WallsGamesController],
  providers: [WallsGamesService],
})
export class WallsGamesModule {}

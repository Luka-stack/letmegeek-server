import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GamesModule } from 'src/games/games.module';
import { UsersModule } from 'src/users/users.module';
import { WallsGamesService } from './walls-games.service';
import { WallsGamesController } from './walls-games.controller';
import { WallsGamesRepository } from './walls-games.repository';

@Module({
  imports: [
    UsersModule,
    GamesModule,
    TypeOrmModule.forFeature([WallsGamesRepository]),
  ],
  controllers: [WallsGamesController],
  providers: [WallsGamesService],
})
export class WallsGamesModule {}

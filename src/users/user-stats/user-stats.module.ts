import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserStatsService } from './user-stats.service';
import { WallsBooksRepository } from '../../walls/walls-books/walls-books.repository';
import { WallsMangasRepository } from '../../walls/walls-mangas/walls-mangas.repository';
import { WallsComicsRepository } from '../../walls/walls-comics/walls-comics.repository';
import { WallsGamesRepository } from '../../walls/walls-games/walls-games.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WallsBooksRepository,
      WallsMangasRepository,
      WallsComicsRepository,
      WallsGamesRepository,
    ]),
  ],
  providers: [UserStatsService],
  exports: [UserStatsService],
})
export class UserStatsModule {}

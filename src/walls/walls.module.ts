import { Module } from '@nestjs/common';
import { WallsBooksModule } from './walls-books/walls-books.module';
import { WallsComicsModule } from './walls-comics/walls-comics.module';
import { WallsGamesModule } from './walls-games/walls-games.module';
import { WallsMangasModule } from './walls-mangas/walls-mangas.module';

@Module({
  imports: [WallsBooksModule, WallsComicsModule, WallsGamesModule, WallsMangasModule],
})
export class WallsModule {}

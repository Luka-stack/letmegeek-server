import WallsBook from 'src/walls/walls-books/entities/walls-book.entity';
import WallsComic from 'src/walls/walls-comics/entities/walls-comic.entity';
import WallsGame from 'src/walls/walls-games/entities/walls-game.entity';
import WallsManga from 'src/walls/walls-mangas/entities/walls-manga.entity';

export class UserStatsDto {
  article: string;
  numericStats: any;
  lastUpdates: Array<WallsBook | WallsComic | WallsManga | WallsGame>;
}

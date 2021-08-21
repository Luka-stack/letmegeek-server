import { Module } from '@nestjs/common';
import { ArticlesMiscController } from './articles-misc.controller';
import { ArticlesMiscService } from './articles-misc.service';
import { BooksModule } from './books/books.module';
import { ComicsModule } from './comics/comics.module';
import { GamesModule } from './games/games.module';
import { MangasModule } from './mangas/mangas.module';

@Module({
  imports: [BooksModule, ComicsModule, GamesModule, MangasModule],
  controllers: [ArticlesMiscController],
  providers: [ArticlesMiscService],
})
export class ArticlesModule {}

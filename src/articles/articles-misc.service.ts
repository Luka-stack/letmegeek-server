import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BooksRepository } from './books/books.repository';
import { ComicsRepository } from './comics/comics.repository';
import { ArticleDraftsFilterDto } from './dto/article-drafts-flter.dto';
import { ArticleDraftDto } from './dto/article-drafts.dto';
import { GamesRepository } from './games/games.repository';
import { MangasRepository } from './mangas/mangas.repository';

@Injectable()
export class ArticlesMiscService {
  constructor(
    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
    @InjectRepository(ComicsRepository)
    private readonly comicsRepository: ComicsRepository,
  ) {}

  async getDrafts(
    articleDraftsFilter: ArticleDraftsFilterDto,
  ): Promise<ArticleDraftDto> {
    const { article } = articleDraftsFilter;
    const wantedArticles =
      article === 'all' ? ['books', 'games', 'comics', 'mangas'] : [article];

    const result = {};
    for (const art of wantedArticles) {
      result[art] = await this.searchForDraft(art);
    }

    return result;
  }

  private async searchForDraft(article: string): Promise<Array<any>> {
    let repository: any;
    switch (article) {
      case 'books':
        repository = this.booksRepository;
        break;
      case 'games':
        repository = this.gamesRepository;
        break;
      case 'comics':
        repository = this.comicsRepository;
        break;
      case 'mangas':
        repository = this.mangasRepository;
        break;
    }

    return await repository.find({ draft: true });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/auth/entities/user-role';

import User from '../users/entities/user.entity';
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
    user: User,
    articleDraftsFilter: ArticleDraftsFilterDto,
  ): Promise<ArticleDraftDto> {
    const { article } = articleDraftsFilter;
    const wantedArticles =
      article === 'all' ? ['books', 'games', 'comics', 'mangas'] : [article];

    const result = {};
    for (const art of wantedArticles) {
      result[art] = await this.searchForDraft(art, user);
    }

    return result;
  }

  private async searchForDraft(
    article: string,
    user: User,
  ): Promise<Array<any>> {
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

    if (user.role == UserRole.USER) {
      return await repository.find({ draft: true, username: user.username });
    }

    return await repository.find({ draft: true });
  }

  // async getDraftsCount() {
  //   // const booksQuery = this.booksRepository
  //   //   .createQueryBuilder('b')
  //   //   .select('COUNT(b.id)')
  //   //   .where('b.draft = false');

  //   // const comicsQuery = this.comicsRepository
  //   //   .createQueryBuilder('c')
  //   //   .select('COUNT(c.id)', 'comics')
  //   //   .addSelect(`(${booksQuery.getQuery()})`, 'books')
  //   //   .where('c.draft = false')
  //   //   .getRawOne();

  //   const comicsQuery = await this.comicsRepository
  //     .createQueryBuilder('c')
  //     .select('COUNT(c.id)', 'comics')
  //     .where('c.draft = false')
  //     .getRawOne();

  //   const booksQuery = await this.comicsRepository
  //     .createQueryBuilder('b')
  //     .select('COUNT(b.id)', 'books')
  //     .where('b.draft = false')
  //     .getRawOne();

  //   return {
  //     comicsQuery,
  //     booksQuery,
  //   };
  // }
}

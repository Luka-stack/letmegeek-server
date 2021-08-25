import { TestingModule, Test } from '@nestjs/testing';

import Comic from '../../articles/comics/entities/comic.entity';
import Game from '../../articles/games/entities/game.entity';
import Manga from '../../articles/mangas/entities/manga.entity';
import Book from '../../articles/books/entities/book.entity';
import { MangaType } from '../../articles/mangas/entities/manga-type';
import { WallsBooksRepository } from '../../walls/walls-books/walls-books.repository';
import { WallsComicsRepository } from '../../walls/walls-comics/walls-comics.repository';
import { WallsGamesRepository } from '../../walls/walls-games/walls-games.repository';
import { WallsMangasRepository } from '../../walls/walls-mangas/walls-mangas.repository';
import { UserStatsService } from './user-stats.service';

const wallsRepoMock = () => ({
  createQueryBuilder: jest.fn(),
  find: jest.fn(),
});

describe('ArticlesMiscService', () => {
  let userStatsService: UserStatsService;
  let wallBooksRepository;
  let wallComicsRepository;
  let wallGamesRepository;
  let wallMangasRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserStatsService,
        { provide: WallsBooksRepository, useFactory: wallsRepoMock },
        { provide: WallsMangasRepository, useFactory: wallsRepoMock },
        { provide: WallsComicsRepository, useFactory: wallsRepoMock },
        { provide: WallsGamesRepository, useFactory: wallsRepoMock },
      ],
    }).compile();

    userStatsService = module.get<UserStatsService>(UserStatsService);
    wallBooksRepository = module.get(WallsBooksRepository);
    wallMangasRepository = module.get(WallsMangasRepository);
    wallGamesRepository = module.get(WallsGamesRepository);
    wallComicsRepository = module.get(WallsComicsRepository);
  });

  describe('getUsersArticleStats', () => {
    const completedStats = {
      status: 'COMPLETED',
      avgScore: '9',
      count: '1',
    };

    const droppedStats = {
      status: 'DROPPED',
      avgScore: '2',
      count: '1',
    };

    const createQueryBuilder: any = {
      select: () => createQueryBuilder,
      addSelect: () => createQueryBuilder,
      groupBy: () => createQueryBuilder,
      where: () => createQueryBuilder,
      getRawMany: () => [completedStats, droppedStats],
    };

    it('return Users books statistics', async () => {
      wallBooksRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );

      const result = await userStatsService.getUsersArticleStats(
        'books',
        'username',
      );

      expect(result).toEqual([completedStats, droppedStats]);
    });

    it('return Users comics statistics', async () => {
      wallComicsRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );

      const result = await userStatsService.getUsersArticleStats(
        'comics',
        'username',
      );

      expect(result).toEqual([completedStats, droppedStats]);
    });

    it('return Users games statistics', async () => {
      wallGamesRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );

      const result = await userStatsService.getUsersArticleStats(
        'games',
        'username',
      );

      expect(result).toEqual([completedStats, droppedStats]);
    });

    it('return Users mangas statistics', async () => {
      wallMangasRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );

      const result = await userStatsService.getUsersArticleStats(
        'mangas',
        'username',
      );

      expect(result).toEqual([completedStats, droppedStats]);
    });
  });

  describe('getLastUsersUpdates', () => {
    const gameUpdate = {
      status: 'IN_PROGRESS',
      score: 8,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:31:27.322Z',
      hoursPlayed: 15,
      startedAt: null,
      finishedAt: null,
    };

    const mockGame = () => {
      const game = new Game();
      game.id = '643790b4-ad59-49dc-baec-f5617e700bac';
      game.slug = 'title_slug';
      game.identifier = '80Vni9G';
      game.title = 'Title Slug';
      game.gears = 'PlayStation 5';
      game.draft = false;
      return game;
    };

    const mangaUpdate = {
      status: 'IN_PROGRESS',
      score: 7,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:39:27.488Z',
      volumes: 50,
      chapters: 150,
      startedAt: null,
      finishedAt: null,
    };

    const mockManga = () => {
      const manga = new Manga();
      manga.id = '643790b4-ad59-49dc-baec-f5617e700bac';
      manga.slug = 'title_test';
      manga.identifier = '80Vni9G';
      manga.title = 'Title test';
      manga.volumes = 55;
      manga.type = MangaType.MANGA;
      manga.draft = false;
      return manga;
    };

    const comicUpdate = {
      status: 'IN_PROGRESS',
      score: 6,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:02:35.837Z',
      issues: 25,
      startedAt: null,
      finishedAt: '2021-05-05T00:00:00.000Z',
    };

    const mockComic = () => {
      const comic = new Comic();
      comic.id = '643790b4-ad59-49dc-baec-f5617e700bac';
      comic.slug = 'title_test';
      comic.identifier = '80Vni9GC';
      comic.title = 'Title Test';
      comic.issues = 55;
      comic.draft = false;
      return comic;
    };

    const bookUpdate = {
      status: 'COMPLETED',
      score: 9,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T12:44:44.466Z',
      pages: 700,
      startedAt: '2021-01-01T00:00:00.000Z',
      finishedAt: null,
    };

    const mockBook = () => {
      const book = new Book();
      book.id = '643790b4-ad59-49dc-baec-f5617e700bac';
      book.slug = 'title_test';
      book.identifier = '80Vni9G';
      book.title = 'Title Test';
      book.draft = false;
      return book;
    };

    it('return Users last books updates', async () => {
      wallBooksRepository.find.mockImplementationOnce(() => [
        {
          ...bookUpdate,
          book: mockBook(),
        },
      ]);

      const result = await userStatsService.getLastUsersUpdates(
        'books',
        'username',
        1,
      );

      expect(result).toEqual([
        {
          ...bookUpdate,
          book: mockBook(),
        },
      ]);
    });

    it('return Users last comics updates', async () => {
      wallComicsRepository.find.mockImplementationOnce(() => [
        {
          ...comicUpdate,
          comic: mockComic(),
        },
      ]);

      const result = await userStatsService.getLastUsersUpdates(
        'comics',
        'username',
        1,
      );

      expect(result).toEqual([
        {
          ...comicUpdate,
          comic: mockComic(),
        },
      ]);
    });

    it('return Users last games updates', async () => {
      wallGamesRepository.find.mockImplementationOnce(() => [
        {
          ...gameUpdate,
          game: mockGame(),
        },
      ]);

      const result = await userStatsService.getLastUsersUpdates(
        'games',
        'username',
        1,
      );

      expect(result).toEqual([
        {
          ...gameUpdate,
          game: mockGame(),
        },
      ]);
    });

    it('return Users last mangas updates', async () => {
      wallMangasRepository.find.mockImplementationOnce(() => [
        {
          ...mangaUpdate,
          manga: mockManga(),
        },
      ]);

      const result = await userStatsService.getLastUsersUpdates(
        'mangas',
        'username',
        1,
      );

      expect(result).toEqual([
        {
          ...mangaUpdate,
          manga: mockManga(),
        },
      ]);
    });
  });
});

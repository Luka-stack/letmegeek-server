import { Test, TestingModule } from '@nestjs/testing';

import User from '../users/entities/user.entity';
import Game from './games/entities/game.entity';
import Comic from './comics/entities/comic.entity';
import Book from './books/entities/book.entity';
import Manga from './mangas/entities/manga.entity';
import { UserRole } from '../auth/entities/user-role';
import { MangaType } from './mangas/entities/manga-type';
import { ArticleDraftsFilterDto } from './dto/article-drafts-flter.dto';
import { ArticlesMiscService } from './articles-misc.service';
import { BooksRepository } from './books/books.repository';
import { ComicsRepository } from './comics/comics.repository';
import { GamesRepository } from './games/games.repository';
import { MangasRepository } from './mangas/mangas.repository';

const articleRepoMock = () => ({
  find: jest.fn(),
});

const mockUser = () => {
  const user = new User();
  user.username = 'Test_User';
  user.role = UserRole.USER;
  return user;
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

const mockBook = () => {
  const book = new Book();
  book.id = '643790b4-ad59-49dc-baec-f5617e700bac';
  book.slug = 'title_test';
  book.identifier = '80Vni9G';
  book.title = 'Title Test';
  book.draft = false;
  return book;
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

describe('ArticlesMiscService', () => {
  let articlesMiscService: ArticlesMiscService;
  let booksRepository;
  let comicsRepository;
  let gamesRepository;
  let mangasRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesMiscService,
        { provide: BooksRepository, useFactory: articleRepoMock },
        { provide: MangasRepository, useFactory: articleRepoMock },
        { provide: ComicsRepository, useFactory: articleRepoMock },
        { provide: GamesRepository, useFactory: articleRepoMock },
      ],
    }).compile();

    articlesMiscService = module.get<ArticlesMiscService>(ArticlesMiscService);
    booksRepository = module.get(BooksRepository);
    mangasRepository = module.get(MangasRepository);
    gamesRepository = module.get(GamesRepository);
    comicsRepository = module.get(ComicsRepository);
  });

  describe('getDrafts', () => {
    const articleFilter = new ArticleDraftsFilterDto();

    it('returns all books drafts', async () => {
      articleFilter.article = 'books';

      booksRepository.find.mockImplementationOnce(() => [mockBook()]);

      const result = await articlesMiscService.getDrafts(
        mockUser(),
        articleFilter,
      );

      expect(result).toEqual({ books: [mockBook()] });
    });

    it('returns all games drafts', async () => {
      articleFilter.article = 'games';

      gamesRepository.find.mockImplementationOnce(() => [mockGame()]);

      const result = await articlesMiscService.getDrafts(
        mockUser(),
        articleFilter,
      );

      expect(result).toEqual({ games: [mockGame()] });
    });

    it('returns all comics drafts', async () => {
      articleFilter.article = 'comics';

      comicsRepository.find.mockImplementationOnce(() => [mockComic()]);

      const result = await articlesMiscService.getDrafts(
        mockUser(),
        articleFilter,
      );

      expect(result).toEqual({ comics: [mockComic()] });
    });

    it('returns all mangas drafts', async () => {
      articleFilter.article = 'mangas';

      mangasRepository.find.mockImplementationOnce(() => [mockManga()]);

      const result = await articlesMiscService.getDrafts(
        mockUser(),
        articleFilter,
      );

      expect(result).toEqual({ mangas: [mockManga()] });
    });

    it('returns all drafts', async () => {
      articleFilter.article = 'all';

      mangasRepository.find.mockImplementationOnce(() => [mockManga()]);
      booksRepository.find.mockImplementationOnce(() => [mockBook()]);
      comicsRepository.find.mockImplementationOnce(() => [mockComic()]);
      gamesRepository.find.mockImplementationOnce(() => [mockGame()]);

      const result = await articlesMiscService.getDrafts(
        mockUser(),
        articleFilter,
      );

      expect(result).toEqual({
        books: [mockBook()],
        mangas: [mockManga()],
        games: [mockGame()],
        comics: [mockComic()],
      });
    });
  });
});

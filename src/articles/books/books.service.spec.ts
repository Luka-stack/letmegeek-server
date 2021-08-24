import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import Book from './entities/book.entity';
import User from '../../users/entities/user.entity';
import { UserRole } from '../../auth/entities/user-role';
import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';
import { BooksFilterDto } from './dto/books-filter.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { allWallArticleStatusesModes } from '../../walls/entities/wall-article-status';

const mockBooksRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  getBook: jest.fn(),
  getBooks: jest.fn(),
  getFilterCount: jest.fn(),
});

const mockBook = () => {
  const book = new Book();
  book.id = '643790b4-ad59-49dc-baec-f5617e700bac';
  book.slug = 'title_test';
  book.identifier = '80Vni9G';
  book.title = 'Title Test';
  book.draft = false;
  book.updatedAt = new Date();
  return book;
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('BooksService', () => {
  let booksService: BooksService;
  let booksRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        BooksService,
        { provide: BooksRepository, useFactory: mockBooksRepository },
      ],
    }).compile();

    booksService = module.get<BooksService>(BooksService);
    booksRepository = module.get(BooksRepository);
  });

  describe('createBook', () => {
    it('call BooksRepository.createBook as a normal user, create draft book and return it', async () => {
      // given
      const book = mockBook();
      const user = mockUser();
      booksRepository.create.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue(book);

      // when
      const result = await booksService.createBook(book, user);

      // then
      const expectedBook = mockBook();
      expectedBook.contributor = user.username;
      expectedBook.draft = true;
      expectedBook.accepted = false;
      expectedBook.createdAt = result.createdAt;
      expectedBook.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedBook);
    });

    it('call BooksRepository.createBook as an admin user, create book and returns it', async () => {
      // given
      const book = mockBook();
      booksRepository.create.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue(book);

      // when
      const user = mockUser();
      user.role = UserRole.ADMIN;
      const result = await booksService.createBook(book, user);

      // then
      const expectedBook = mockBook();
      expectedBook.contributor = user.username;
      expectedBook.accepted = !expectedBook.draft;
      expectedBook.createdAt = result.createdAt;
      expectedBook.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedBook);
    });

    it('call BooksRepositroy.createBook, return 409 since Title is not unique', async () => {
      // given
      const book = mockBook();
      booksRepository.create.mockResolvedValue(book);
      booksRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(booksService.createBook(book, mockUser())).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getBooks', () => {
    const booksFilter = new BooksFilterDto();
    const user = mockUser();

    const book = {
      book_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      book_slug: 'title_test',
      book_identifier: '80Vni9G',
      book_title: 'Title Test',
      book_draft: false,
      book_createdAt: new Date(),
      book_updatedAt: new Date(),
      book_imageUrl: 'image Path',
      bookStats_avgScore: '5',
      bookStats_countScore: '5',
      bookStats_members: '5',
    };

    const bookWithUsersScoring = {
      book_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      book_slug: 'title_test',
      book_identifier: '80Vni9G',
      book_title: 'Title Test',
      book_draft: false,
      book_createdAt: new Date(),
      book_updatedAt: new Date(),
      book_imageUrl: 'image Path',
      bookStats_avgScore: '5',
      bookStats_countScore: '5',
      bookStats_members: '5',
      wallBook_status: allWallArticleStatusesModes()[0],
      wallBook_score: '5',
    };

    it('return paginated data : total count 0, no prev, no next, no books', async () => {
      booksRepository.getFilterCount.mockResolvedValue(0);
      booksRepository.getBooks.mockResolvedValue([]);

      booksFilter.page = 0;
      booksFilter.limit = 1;

      const response = await booksService.getBooks(booksFilter, mockUser());

      expect(response).toEqual({
        totalCount: 0,
        page: booksFilter.page,
        limit: booksFilter.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return paginated data : total count 2, no prev page, has next page, has books', async () => {
      booksRepository.getFilterCount.mockResolvedValue(2);
      booksRepository.getBooks.mockResolvedValue([book, book]);

      booksFilter.page = 0;
      booksFilter.limit = 1;

      const response = await booksService.getBooks(booksFilter, mockUser());

      expect(response).toEqual({
        totalCount: 2,
        page: booksFilter.page,
        limit: booksFilter.limit,
        data: [book, book],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/books/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('return paginated data : total count 3, has prev page, has next page, has books', async () => {
      booksRepository.getFilterCount.mockResolvedValue(3);
      booksRepository.getBooks.mockResolvedValue([book, book, book]);

      booksFilter.page = 2;
      booksFilter.limit = 1;

      const response = await booksService.getBooks(booksFilter, user);

      expect(response).toEqual({
        totalCount: 3,
        page: booksFilter.page,
        limit: booksFilter.limit,
        data: [book, book, book],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/books/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/book/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('call BooksRepository.getBooks as a user, return array of books with statistics', async () => {
      booksFilter.page = 1;
      booksFilter.limit = 1;

      // given
      booksRepository.getFilterCount.mockResolvedValue(1);
      booksRepository.getBooks.mockResolvedValue([book]);

      // when
      const result = await booksService.getBooks(booksFilter, user);

      // then
      expect(result.data.length).toEqual(1);
      expect(result.data).toEqual([book]);
    });

    it('call BooksRepository.getBooks as a user, return array of books with statistics and users score', async () => {
      booksFilter.page = 1;
      booksFilter.limit = 1;

      // given
      booksRepository.getFilterCount.mockResolvedValue(1);
      booksRepository.getBooks.mockResolvedValue([book, bookWithUsersScoring]);

      // when
      const result = await booksService.getBooks(booksFilter, user);

      // then
      expect(result.data.length).toEqual(2);
      expect(result.data[0]).toEqual(book);
      expect(result.data[1]).toEqual(bookWithUsersScoring);
    });
  });

  describe('getOneBook', () => {
    const user = mockUser();

    const book = {
      book_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      book_slug: 'title_test',
      book_identifier: '80Vni9G',
      book_title: 'Title Test',
      book_draft: false,
      book_createdAt: new Date(),
      book_updatedAt: new Date(),
      book_imageUrl: 'image Path',
      bookStats_avgScore: '5',
      bookStats_countScore: '5',
      bookStats_members: '5',
    };

    const bookWithUsersScoring = {
      book_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      book_slug: 'title_test',
      book_identifier: '80Vni9G',
      book_title: 'Title Test',
      book_draft: false,
      book_createdAt: new Date(),
      book_updatedAt: new Date(),
      book_imageUrl: 'image Path',
      bookStats_avgScore: '5',
      bookStats_countScore: '5',
      bookStats_members: '5',
      wallBook_status: allWallArticleStatusesModes()[0],
      wallBook_score: '5',
    };

    it('call BooksRepository.getOneBook, return book with statistics', async () => {
      // given
      booksRepository.getBook.mockResolvedValue(book);

      // when
      const result = await booksService.getOneBook('identifier', 'slug', user);

      // then
      expect(result).toEqual(book);
    });

    it('call BooksRepository.getOneBook, return book with statistics and users score', async () => {
      // given
      booksRepository.getBook.mockResolvedValue(bookWithUsersScoring);

      // when
      const result = await booksService.getOneBook('identifier', 'slug', user);

      // then
      expect(result).toEqual(bookWithUsersScoring);
    });

    it('call BooksRepository.getOneBook, return 404', async () => {
      // given
      booksRepository.getBook.mockResolvedValue(null);

      // when, then
      expect(
        booksService.getOneBook('someId', 'slug', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateBook', () => {
    const book = mockBook();

    it('calls BooksRepository.findOne and throws NotFoundException', async () => {
      // given
      booksRepository.findOne.mockResolvedValue(null);

      // when, then
      expect(
        booksService.updateBook('someId', 'slug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('call BookRepository.findOne, find book then call BookRepository.save, update and return it', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue(book);

      // when
      const updatedBook = {
        title: 'updatedTitle',
      };
      const result = await booksService.updateBook(
        book.identifier,
        book.slug,
        updatedBook,
      );

      // then
      book.title = updatedBook.title;
      expect(result).toEqual(book);
    });

    it('call BookRepository.findOne, find book, validate authors, publishers and genres', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue(book);

      // when
      const updatedBook = {
        authors: 'Test1, Test1, Test1',
        publishers: 'Test2, Test2, Test2',
        genres: 'Test3, Test3, Test3',
      };
      const result = await booksService.updateBook(
        book.identifier,
        book.slug,
        updatedBook,
      );

      // then
      expect(result.authors).toEqual(updatedBook.authors.replace(' ', ''));
      expect(result.publishers).toEqual(
        updatedBook.publishers.replace(' ', ''),
      );
      expect(result.genres).toEqual(updatedBook.genres.replace(' ', ''));
    });

    it('call BookRepository.findOne, find book then call BookRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue(book);

      // when
      const updatedBook = {
        draft: true,
      };
      const result = await booksService.updateBook(
        book.identifier,
        book.slug,
        updatedBook,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('call BookRepository.findOne, find book then call BookRepository.save, draft stays false and timestamp stays the same', async () => {
      // given
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue(book);

      // when
      const updatedBook = {
        draft: false,
      };
      const result = await booksService.updateBook(
        book.identifier,
        book.slug,
        updatedBook,
      );

      // then
      expect(result.createdAt).toEqual(book.createdAt);
    });

    it('call BookRepository.findOne, find book then call BookRepository.save and throw 409 due to not unique Title', async () => {
      // given
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        booksService.updateBook(
          book.identifier,
          book.slug,
          new UpdateBookDto(),
        ),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteBook', () => {
    it('call BookRepository.delete, throw NotFoundException', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 0 });

      expect(booksService.deleteBook('someId', 'slug')).rejects.toThrowError(
        NotFoundException,
      );
    });
  });
});

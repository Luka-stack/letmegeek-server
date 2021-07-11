import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import Book from './entities/book.entity';
import User from '../users/entities/user.entity';
import WallsBook from '../walls/walls-books/entities/walls-book.entity';
import { UserRole } from '../auth/entities/user-role';
import { slugify } from '../utils/helpers';
import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';

const mockBooksRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  getBooks: jest.fn(),
  getCompleteBook: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const mockBook = () => {
  return {
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'title_test',
    identifier: '80Vni9G',
    title: 'Title Test',
    draft: false,
    wallsBooks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
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
      booksRepository.create.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue(book);

      // when
      const result = await booksService.createBook(book, mockUser());

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(book.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: book.title,
        draft: true,
        wallsBooks: [],
      });
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
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(book.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: book.title,
        draft: book.draft,
        wallsBooks: [],
      });
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
    const user = mockUser();
    const book = mockBook();
    const wallsBook = new WallsBook();
    wallsBook.username = user.username;
    wallsBook.score = 5;
    book.wallsBooks = [wallsBook];

    it('call BooksRepository.getBooks, return array of books', async () => {
      // given
      booksRepository.getBooks.mockResolvedValue([book]);

      // when
      const result = await booksService.getBooks(null, null);

      // then
      expect(result).toHaveLength(1);
      expect(result).toEqual([book]);
    });

    it('call BooksRepository.getBooks as a user, return array of books with users wallsbook', async () => {
      // given
      booksRepository.getBooks.mockResolvedValue([book]);

      // when
      const result = await booksService.getBooks(null, user);

      // then
      expect(result).toHaveLength(1);
      expect(result).toEqual([book]);
      expect(result[0].userWallsBook).toEqual(wallsBook);
    });
  });

  describe('getOneBook', () => {
    const book = mockBook();
    const user = mockUser();
    const wallsBook = new WallsBook();
    wallsBook.username = user.username;
    wallsBook.score = 5;
    book.wallsBooks = [wallsBook];

    it('call BooksRepository.getOneBook, return book', async () => {
      // given
      booksRepository.getCompleteBook.mockResolvedValue(book);

      // when
      const result = await booksService.getOneBook('identifier', 'slug', null);

      // then
      expect(result).toEqual(book);
    });

    it('call BooksRepository.getOneBook as a user, return book with users wallsbook', async () => {
      // given
      booksRepository.getCompleteBook.mockResolvedValue(book);

      // when
      const result = await booksService.getOneBook('identifier', 'slug', user);

      // then
      expect(result).toEqual(book);
      expect(result.userWallsBook).toEqual(wallsBook);
    });

    it('call BooksRepository.getOneBook, return 404', async () => {
      // given
      booksRepository.getCompleteBook.mockResolvedValue(null);

      // when, then
      expect(
        booksService.getOneBook('someId', 'slug', null),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateBook', () => {
    const book = mockBook();
    const bookClass = new Book();

    it('calls BooksRepository.findOne and throws NotFoundException', async () => {
      // given
      booksRepository.findOne.mockResolvedValue(null);

      // when, then
      expect(
        booksService.updateBook('someId', 'slug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('call BookRepository.findOne, find book then call BookRepository.save, update and return it', async () => {
      bookClass.title = book.title;
      booksRepository.findOne.mockResolvedValue(bookClass);
      booksRepository.save.mockResolvedValue(bookClass);

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
      expect(result).toEqual({
        title: updatedBook.title,
      });
    });

    it('call BookRepository.findOne, find book then call BookRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      bookClass.title = book.title;
      bookClass.createdAt = book.createdAt;

      booksRepository.findOne.mockResolvedValue(bookClass);
      booksRepository.save.mockResolvedValue(bookClass);

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
      bookClass.title = book.title;
      bookClass.createdAt = book.createdAt;
      booksRepository.findOne.mockResolvedValue(bookClass);
      booksRepository.save.mockResolvedValue(bookClass);

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
        booksService.updateBook(book.identifier, book.slug, {}),
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

    it('call BookRepository.delete, delete Book and return void', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 1 });

      expect(
        booksService.deleteBook('someId', 'slug'),
      ).resolves.toHaveBeenCalled();
    });
  });
});

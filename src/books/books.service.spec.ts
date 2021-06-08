import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { slugify } from '../utils/helpers';
import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';
import Book from './entities/book.entity';

const mockBooksRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  getBooks: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

const mockBook = {
  id: '643790b4-ad59-49dc-baec-f5617e700bac',
  slug: 'title_test',
  identifier: '80Vni9G',
  title: 'Title Test',
  draft: false,
  createdAt: new Date(),
  updatedAt: new Date(),
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
    it('calls BooksRepository.create and save, creates one and returns newly created book', async () => {
      // given
      booksRepository.create.mockResolvedValue(mockBook);
      booksRepository.save.mockResolvedValue(mockBook);

      // when
      const result = await booksService.createBook(mockBook);

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(mockBook.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: mockBook.title,
        draft: mockBook.draft,
      });
    });

    it('calls BooksRepositroy.create and save, return 409 since Title is not unique', async () => {
      // given
      booksRepository.create.mockResolvedValue(mockBook);
      booksRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(booksService.createBook(mockBook)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getBooks', () => {
    it('calls BooksRepository.getBooks, return array of books', async () => {
      // given
      booksRepository.getBooks.mockResolvedValue([mockBook]);

      // when
      const result = await booksService.getBooks(null);

      // then
      expect(result).toHaveLength(1);
      expect(result).toEqual([mockBook]);
    });
  });

  describe('updateBooks', () => {
    it('calls BooksRepository.findOne and throws NotFoundException', async () => {
      // given
      booksRepository.findOne.mockResolvedValue(null);

      // when, then
      expect(booksService.updateBook('someId', 'slug', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls BookRepository.findOne, finds book then calls BookRepository.save, updates book and returns books', async () => {
      // given
      const mockBookObject = new Book();
      mockBookObject.title = mockBook.title;

      booksRepository.findOne.mockResolvedValue(mockBookObject);
      booksRepository.save.mockResolvedValue(mockBookObject);

      // when
      const updatedBook = {
        title: 'updatedTitle',
      };
      const result = await booksService.updateBook(
        mockBook.identifier,
        mockBook.slug,
        updatedBook,
      );

      // then
      expect(result).toEqual({
        title: updatedBook.title,
      });
    });

    it('calls BookRepository.findOne, finds book then calls BookRepository.save, updates draft to true and updates timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockBookObject = new Book();
      mockBookObject.title = mockBook.title;
      mockBookObject.createdAt = date;

      booksRepository.findOne.mockResolvedValue(mockBookObject);
      booksRepository.save.mockResolvedValue(mockBookObject);

      // when
      const updatedBook = {
        draft: true,
      };
      const result = await booksService.updateBook(
        mockBook.identifier,
        mockBook.slug,
        updatedBook,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('calls BookRepository.findOne, finds book then calls BookRepository.save, draft stays false and timestamp stays the same', async () => {
      // given
      const mockBookObject = new Book();
      mockBookObject.title = mockBook.title;
      mockBookObject.createdAt = mockBook.createdAt;

      booksRepository.findOne.mockResolvedValue(mockBookObject);
      booksRepository.save.mockResolvedValue(mockBookObject);

      // when
      const updatedBook = {
        draft: false,
      };
      const result = await booksService.updateBook(
        mockBook.identifier,
        mockBook.slug,
        updatedBook,
      );

      // then
      expect(result.createdAt).toEqual(mockBookObject.createdAt);
    });

    it('calls BookRepository.findOne, finds book then calls BookRepository.save and throw 409 due to not unique Title', async () => {
      // given
      const mockBookObject = new Book();
      mockBookObject.title = mockBook.title;

      booksRepository.findOne.mockResolvedValue(mockBookObject);
      booksRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        booksService.updateBook(mockBook.identifier, mockBook.slug, {}),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteBook', () => {
    it('calls BookRepository.delete, throw NotFoundException', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 0 });

      expect(booksService.deleteBook('someId', 'slug')).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('calls BookRepository.delete, delets Book and return void', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 1 });

      expect(
        booksService.deleteBook('someId', 'slug'),
      ).resolves.toHaveBeenCalled();
    });
  });
});

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { BooksRepository } from './books.repository';
import { BooksService } from './books.service';

// type MockType<T> = {
//   [P in keyof T]?: jest.Mock<any>;
// };

const mockBooksRepository = () => ({
  createBook: jest.fn((dto) => ({
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'test-slug',
    identifier: '80Vni9G',
    ...dto,
  })),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('BooksService', () => {
  let booksService: BooksService;
  let booksRepository; // MockType<Repository<Book>>;

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
    it('calls BooksRepository.createBook, creates one and returns newly created book', async () => {
      const mockBook = {
        title: 'Title',
        author: 'Author',
        publisher: 'Publisher',
        premiered: new Date(),
        draft: false,
      };

      // booksRepository.createBook.mockResolvedValue(mockBook);
      const result = await booksService.createBook(mockBook);

      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: expect.any(String),
        ...mockBook,
      });
    });
  });

  describe('getBooks', () => {
    it('calls BooksRepository.find, return array of books', async () => {
      const mockBooks = [
        {
          title: 'Title',
          author: 'Author',
          publisher: 'Publisher',
          premiered: new Date(),
          draft: false,
        },
      ];

      booksRepository.find.mockResolvedValue(mockBooks);
      const result = await booksService.getBooks();

      expect(result).toHaveLength(1);
      expect(result).toEqual(mockBooks);
    });
  });

  describe('updateBooks', () => {
    it('calls BooksRepository.findOne and throws NotFoundException', async () => {
      booksRepository.findOne.mockResolvedValue(null);

      expect(booksService.updateBook('someId', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls BookRepository.findOne, finds book then calls BookRepository.save, updates book and returns books', async () => {
      const mockBook = {
        id: '643790b4-ad59-49dc-baec-f5617e700bac',
        slug: 'test-slug',
        identifier: '80Vni9G',
        title: 'Title',
        author: 'Author',
        publisher: 'Publisher',
        premiered: new Date(),
        draft: false,
      };

      booksRepository.findOne.mockResolvedValue(mockBook);

      const updatedBook = {
        draft: true,
        title: 'updatedTitle',
      };
      const result = await booksService.updateBook(
        '643790b4-ad59-49dc-baec-f5617e700bac',
        updatedBook,
      );

      expect(result).toEqual({ ...mockBook, ...updatedBook });
    });
  });

  describe('deleteBook', () => {
    it('calls BookRepository.delete, throw NotFoundException', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 0 });

      expect(booksService.deleteBook('someId')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('calls BookRepository.delete, delets Book and return void', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 1 });

      expect(booksService.deleteBook('someId')).resolves.toBeCalled();
    });
  });
});

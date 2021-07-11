import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import Book from '../../books/entities/book.entity';
import User from '../../users/entities/user.entity';
import WallsBook from './entities/walls-book.entity';
import { UserRole } from '../../auth/entities/user-role';
import { WallsBookDto } from './dto/walls-book.dto';
import { BooksRepository } from '../../books/books.repository';
import { WallsBooksRepository } from './walls-books.repository';
import { WallsBooksService } from './walls-books.service';
import { WallArticleStatus } from '../entities/wall-article-status';

const mockWallsBooksRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  getRecords: jest.fn(),
});

const mockBooksRepository = () => ({
  findOne: jest.fn(),
});

const wallsBookDto = () => {
  const wallsBook = new WallsBookDto();
  wallsBook.status = WallArticleStatus.COMPLETED;
  return wallsBook;
};

const mockWallsBook = (user?: User, book?: Book) => {
  const wall = new WallsBook();
  wall.user = user;
  wall.book = book;
  wall.status = WallArticleStatus.COMPLETED;
  return wall;
};

const mockBook = () => {
  const book = new Book();
  return book;
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('WallsBooksService', () => {
  let wallsBooksService: WallsBooksService;
  let wallsBooksRepository;
  let booksRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WallsBooksService,
        { provide: WallsBooksRepository, useFactory: mockWallsBooksRepository },
        { provide: BooksRepository, useFactory: mockBooksRepository },
      ],
    }).compile();

    wallsBooksService = module.get<WallsBooksService>(WallsBooksService);
    wallsBooksRepository = module.get(WallsBooksRepository);
    booksRepository = module.get(BooksRepository);
  });

  describe('createRecord', () => {
    it('throw NotFoundException (404), provided wrong books identifier', async () => {
      booksRepository.findOne.mockResolvedValue(null);

      expect(
        wallsBooksService.createRecord('bookId', wallsBookDto(), mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw ConflictException (409), provided book already registered in users wallsbook', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.findOne.mockResolvedValue(mockWallsBook());

      expect(
        wallsBooksService.createRecord('bookId', wallsBookDto(), mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('successfully creates new record', async () => {
      const book = mockBook();
      const user = mockUser();
      const wall = mockWallsBook(user, book);

      booksRepository.findOne.mockResolvedValue(book);
      wallsBooksRepository.findOne.mockResolvedValue(null);
      wallsBooksRepository.create.mockResolvedValue(wall);

      const response = await wallsBooksService.createRecord(
        'bookId',
        wall,
        user,
      );

      expect(response).toEqual(wall);
    });
  });

  describe('updateRecord', () => {
    it('throw NotFoundException (404), provided wrong books identifier', async () => {
      wallsBooksRepository.findOne.mockResolvedValue(null);

      expect(
        wallsBooksService.updateRecord('bookId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('update record associated with provided book identifier', async () => {
      const wallsBook = mockWallsBook(mockUser(), mockBook());
      const updateDto = {
        score: 1,
        status: WallArticleStatus.IN_PROGRESS,
        startedAt: new Date(),
        finishedAt: new Date(),
        pages: 5555,
      };

      wallsBooksRepository.findOne.mockResolvedValue(wallsBook);
      wallsBooksRepository.save.mockImplementation((saved) => {
        return saved;
      });

      const response = await wallsBooksService.updateRecord(
        'bookId',
        updateDto,
        mockUser(),
      );

      expect(response.score).toEqual(updateDto.score);
      expect(response.status).toEqual(updateDto.status);
      expect(response.startedAt).toEqual(updateDto.startedAt);
      expect(response.finishedAt).toEqual(updateDto.finishedAt);
      expect(response.pages).toEqual(updateDto.pages);
      expect(response.book).toEqual(wallsBook.book);
      expect(response.user).toEqual(wallsBook.user);
    });
  });

  describe('deleteRecord', () => {
    it('throw NotFoundException (404), provided wrong books identifier', async () => {
      wallsBooksRepository.findOne.mockResolvedValue(null);

      expect(
        wallsBooksService.deleteRecord('bookId', mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('getRecordsByUser', () => {
    it('return list of WallsBook', async () => {
      wallsBooksRepository.getRecords.mockResolvedValue([mockWallsBook()]);

      const response = await wallsBooksService.getRecordsByUser(
        'username',
        null,
      );

      expect(response).toHaveLength(1);
      expect(response).toEqual([mockWallsBook()]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import Book from '../../books/entities/book.entity';
import BooksReview from './entities/books-review.entity';
import { UserRole } from '../../auth/entities/user-role';
import { BooksReviewDto } from './dto/books-review.dto';
import { BooksReviewsService } from './books-reviews.service';
import { BooksRepository } from '../../books/books.repository';
import { WallsBooksRepository } from '../../walls/walls-books/walls-books.repository';
import { BooksReviewsRepository } from './books-reviews.repository';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { UpdateBooksReviewDto } from './dto/update-books-review.dto';
import { ConfigModule } from '@nestjs/config';

const mockbooksReviewsRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForBook: jest.fn(),
  getReviewsForUser: jest.fn(),
});

const mockwallsBooksRepository = () => ({
  checkUserHasStatusesOnBook: jest.fn(),
});

const mockbooksRepository = () => ({
  findOne: jest.fn(),
});

const mockBookReview = (user?: User, book?: Book) => {
  const review = new BooksReview();
  review.user = user;
  review.book = book;
  return review;
};

const mockBook = () => {
  const book = new Book();
  return book;
};

const mockUser = () => {
  const user = new User();
  user.username = 'Test';
  return user;
};

describe('BooksReviewsService', () => {
  let booksReviewsService: BooksReviewsService;
  let booksReviewsRepository;
  let wallsBooksRepository;
  let booksRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        BooksReviewsService,
        {
          provide: BooksReviewsRepository,
          useFactory: mockbooksReviewsRepository,
        },
        { provide: WallsBooksRepository, useFactory: mockwallsBooksRepository },
        { provide: BooksRepository, useFactory: mockbooksRepository },
      ],
    }).compile();

    booksReviewsService = module.get<BooksReviewsService>(BooksReviewsService);
    booksReviewsRepository = module.get(BooksReviewsRepository);
    wallsBooksRepository = module.get(WallsBooksRepository);
    booksRepository = module.get(BooksRepository);
  });

  describe('createReview', () => {
    const reviewDto = new BooksReviewDto();
    reviewDto.review = 'Some Review';
    reviewDto.overall = 1;
    reviewDto.art = 2;
    reviewDto.characters = 3;
    reviewDto.story = 4;
    reviewDto.enjoyment = 5;

    it('throw NotFoundException (404), attempt to create a review for book that doesnt exist', async () => {
      booksRepository.findOne.mockResolvedValue(null);

      expect(
        booksReviewsService.createReview('bookId', reviewDto, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw ConflictException (409), attempt to create a review for book that user doesnt have on their wall', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.checkUserHasStatusesOnBook.mockResolvedValue(false);

      expect(
        booksReviewsService.createReview('bookId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('throw ConflictException (409), attempt to create a review for book that already have the users review', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.checkUserHasStatusesOnBook.mockResolvedValue(true);
      booksReviewsRepository.findOne.mockResolvedValue(mockBookReview());

      expect(
        booksReviewsService.createReview('bookId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('return created review, successfully created review', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.checkUserHasStatusesOnBook.mockResolvedValue(true);
      booksReviewsRepository.findOne.mockResolvedValue(null);
      booksReviewsRepository.create.mockImplementationOnce((dto: any) => {
        const newReview = mockBookReview(dto.user, dto.book);
        newReview.review = dto.review;
        newReview.overall = dto.overall;
        newReview.art = dto.art;
        newReview.characters = dto.characters;
        newReview.story = dto.story;
        newReview.enjoyment = dto.enjoyment;
        return newReview;
      });

      const response = await booksReviewsService.createReview(
        'bookId',
        reviewDto,
        mockUser(),
      );

      expect(response).toEqual({
        user: mockUser(),
        book: mockBook(),
        ...reviewDto,
      });
    });
  });

  describe('getReviews', () => {
    const pagination = new PaginationDto();

    it('For User : total count 0, no prev and next page, no reviews', async () => {
      booksReviewsRepository.reviewsCount.mockResolvedValue(0);
      booksReviewsRepository.getReviewsForUser.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await booksReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 0,
        page: pagination.page,
        limit: pagination.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('For User : total count 5, no prev page, has next page, has reviews', async () => {
      booksReviewsRepository.reviewsCount.mockResolvedValue(5);
      booksReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockBookReview(),
        mockBookReview(),
        mockBookReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await booksReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockBookReview(), mockBookReview(), mockBookReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/book/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For User : total count 5, has prev page, has next page, has reviews', async () => {
      booksReviewsRepository.reviewsCount.mockResolvedValue(5);
      booksReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockBookReview(),
        mockBookReview(),
        mockBookReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await booksReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockBookReview(), mockBookReview(), mockBookReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/book/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/book/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);

      console.log(response);
    });

    it('For Book : total count 0, no prev and next page, no reviews', async () => {
      booksReviewsRepository.reviewsCount.mockResolvedValue(0);
      booksReviewsRepository.getReviewsForBook.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await booksReviewsService.getReviews(
        pagination,
        'bookId',
      );

      expect(response).toEqual({
        totalCount: 0,
        page: pagination.page,
        limit: pagination.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('For Book : total count 5, no prev page, has next page, has reviews', async () => {
      booksReviewsRepository.reviewsCount.mockResolvedValue(5);
      booksReviewsRepository.getReviewsForBook.mockResolvedValue([
        mockBookReview(),
        mockBookReview(),
        mockBookReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await booksReviewsService.getReviews(
        pagination,
        'bookId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockBookReview(), mockBookReview(), mockBookReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/book/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For Book : total count 5, has prev page, has next page, has reviews', async () => {
      booksReviewsRepository.reviewsCount.mockResolvedValue(5);
      booksReviewsRepository.getReviewsForBook.mockResolvedValue([
        mockBookReview(),
        mockBookReview(),
        mockBookReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await booksReviewsService.getReviews(
        pagination,
        'bookId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockBookReview(), mockBookReview(), mockBookReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/book/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/book/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });
  });

  describe('updateReview', () => {
    it('throw NotFoundException (404), attempt to update review that doesnt exsit', async () => {
      booksReviewsRepository.findOne.mockResolvedValue(null);

      expect(
        booksReviewsService.updateReview('reviewId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return updated review, successfully update review', async () => {
      booksReviewsRepository.findOne.mockResolvedValue(
        mockBookReview(mockUser(), mockBook()),
      );
      booksReviewsRepository.save.mockImplementationOnce(
        (review: any) => review,
      );

      const updateDto = new UpdateBooksReviewDto();
      updateDto.review = 'New Review';
      updateDto.overall = 9;
      updateDto.art = 8;
      updateDto.characters = 7;
      updateDto.story = 6;
      updateDto.enjoyment = 5;

      const response = await booksReviewsService.updateReview(
        'reviewId',
        updateDto,
        mockUser(),
      );

      expect(response).toEqual({
        book: mockBook(),
        user: mockUser(),
        review: updateDto.review,
        overall: updateDto.overall,
        art: updateDto.art,
        characters: updateDto.characters,
        story: updateDto.story,
        enjoyment: updateDto.enjoyment,
      });
    });
  });

  describe('deleteReviews', () => {
    it('throw NotFoundException (404), attempt to delete review that doesnt exists, user is an Admin', async () => {
      booksReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const adminUser = mockUser();
      adminUser.role = UserRole.ADMIN;
      expect(
        booksReviewsService.deleteReview('reviewId', adminUser),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw NotFoundException (404), attempt to delete review that doesnt exists, user is not an Admin', async () => {
      booksReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const user = mockUser();
      user.role = UserRole.USER;
      expect(
        booksReviewsService.deleteReview('reviewId', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });
});

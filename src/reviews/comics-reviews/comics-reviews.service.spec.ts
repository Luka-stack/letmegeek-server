import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import Comic from '../../comics/entities/comic.entity';
import ComicsReview from './entities/comics-review.entity';
import { UserRole } from '../../auth/entities/user-role';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { ComicsReviewDto } from './dto/comics-review.dto';
import { UpdateComicsReviewDto } from './dto/update-comics-review.dto';
import { ComicsReviewsService } from './comics-reviews.service';
import { ComicsRepository } from '../../comics/comics.repository';
import { WallsComicsRepository } from '../../walls/walls-comics/walls-comics.repository';
import { ComicsReviewsRepository } from './comics-reviews.repository';

const mockComicsReviewsRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForUser: jest.fn(),
  getReviewsForComic: jest.fn(),
});

const mockWallsComicsRepository = () => ({
  checkUserHasStatusesOnComic: jest.fn(),
});

const mockComicsRepository = () => ({
  findOne: jest.fn(),
});

const mockComicReview = (user?: User, comic?: Comic) => {
  const review = new ComicsReview();
  review.user = user;
  review.comic = comic;
  return review;
};

const mockUser = () => {
  const user = new User();
  user.username = 'Test';
  return user;
};

const mockComic = () => {
  return new Comic();
};

describe('ComicsReviewsService', () => {
  let comicsReviewsService: ComicsReviewsService;
  let comicsReviewsRepository;
  let wallsComicsRepository;
  let comicsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        ComicsReviewsService,
        {
          provide: ComicsReviewsRepository,
          useFactory: mockComicsReviewsRepository,
        },
        {
          provide: WallsComicsRepository,
          useFactory: mockWallsComicsRepository,
        },
        {
          provide: ComicsRepository,
          useFactory: mockComicsRepository,
        },
      ],
    }).compile();

    comicsReviewsService =
      module.get<ComicsReviewsService>(ComicsReviewsService);
    comicsReviewsRepository = module.get(ComicsReviewsRepository);
    wallsComicsRepository = module.get(WallsComicsRepository);
    comicsRepository = module.get(ComicsRepository);
  });

  describe('createReview', () => {
    const reviewDto = new ComicsReviewDto();
    reviewDto.review = 'Some Review';
    reviewDto.overall = 1;
    reviewDto.art = 2;
    reviewDto.characters = 3;
    reviewDto.story = 4;
    reviewDto.enjoyment = 5;

    it('throw NotFoundException (404), attempt to create a review for comic that doesnt exist', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      expect(
        comicsReviewsService.createReview('comicId', reviewDto, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw ConflictException (409), attempt to create a review for comic that user doesnt have on their wall', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.checkUserHasStatusesOnComic.mockResolvedValue(
        false,
      );

      expect(
        comicsReviewsService.createReview('comicId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('throw ConflictException (409), attempt to create a review for comic that already have the users review', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.checkUserHasStatusesOnComic.mockResolvedValue(true);
      comicsReviewsRepository.findOne.mockResolvedValue(mockComicReview());

      expect(
        comicsReviewsService.createReview('comicId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('return created review, successfully created review', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.checkUserHasStatusesOnComic.mockResolvedValue(true);
      comicsReviewsRepository.findOne.mockResolvedValue(null);
      comicsReviewsRepository.create.mockImplementationOnce((dto: any) => {
        const newReview = mockComicReview(dto.user, dto.comic);
        newReview.review = dto.review;
        newReview.overall = dto.overall;
        newReview.art = dto.art;
        newReview.characters = dto.characters;
        newReview.story = dto.story;
        newReview.enjoyment = dto.enjoyment;
        return newReview;
      });

      const response = await comicsReviewsService.createReview(
        'comicId',
        reviewDto,
        mockUser(),
      );

      expect(response).toEqual({
        user: mockUser(),
        comic: mockComic(),
        ...reviewDto,
      });
    });
  });

  describe('getReviews', () => {
    const pagination = new PaginationDto();

    it('For User : total count 0, no prev and next page, no reviews', async () => {
      comicsReviewsRepository.reviewsCount.mockResolvedValue(0);
      comicsReviewsRepository.getReviewsForUser.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await comicsReviewsService.getReviews(
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
      comicsReviewsRepository.reviewsCount.mockResolvedValue(5);
      comicsReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockComicReview(),
        mockComicReview(),
        mockComicReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await comicsReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockComicReview(), mockComicReview(), mockComicReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/comic/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For User : total count 5, has prev page, has next page, has reviews', async () => {
      comicsReviewsRepository.reviewsCount.mockResolvedValue(5);
      comicsReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockComicReview(),
        mockComicReview(),
        mockComicReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await comicsReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockComicReview(), mockComicReview(), mockComicReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/comic/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/comic/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('For comic : total count 0, no prev and next page, no reviews', async () => {
      comicsReviewsRepository.reviewsCount.mockResolvedValue(0);
      comicsReviewsRepository.getReviewsForComic.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await comicsReviewsService.getReviews(
        pagination,
        'comicId',
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

    it('For comic : total count 5, no prev page, has next page, has reviews', async () => {
      comicsReviewsRepository.reviewsCount.mockResolvedValue(5);
      comicsReviewsRepository.getReviewsForComic.mockResolvedValue([
        mockComicReview(),
        mockComicReview(),
        mockComicReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await comicsReviewsService.getReviews(
        pagination,
        'comicId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockComicReview(), mockComicReview(), mockComicReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/comic/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For comic : total count 5, has prev page, has next page, has reviews', async () => {
      comicsReviewsRepository.reviewsCount.mockResolvedValue(5);
      comicsReviewsRepository.getReviewsForComic.mockResolvedValue([
        mockComicReview(),
        mockComicReview(),
        mockComicReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await comicsReviewsService.getReviews(
        pagination,
        'comicId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockComicReview(), mockComicReview(), mockComicReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/comic/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/comic/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });
  });

  describe('updateReview', () => {
    it('throw NotFoundException (404), attempt to update review that doesnt exsit', async () => {
      comicsReviewsRepository.findOne.mockResolvedValue(null);

      expect(
        comicsReviewsService.updateReview('reviewId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return updated review, successfully update review', async () => {
      comicsReviewsRepository.findOne.mockResolvedValue(
        mockComicReview(mockUser(), mockComic()),
      );
      comicsReviewsRepository.save.mockImplementationOnce(
        (review: any) => review,
      );

      const updateDto = new UpdateComicsReviewDto();
      updateDto.review = 'New Review';
      updateDto.overall = 9;
      updateDto.art = 8;
      updateDto.characters = 7;
      updateDto.story = 6;
      updateDto.enjoyment = 5;

      const response = await comicsReviewsService.updateReview(
        'reviewId',
        updateDto,
        mockUser(),
      );

      expect(response).toEqual({
        comic: mockComic(),
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
      comicsReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const adminUser = mockUser();
      adminUser.role = UserRole.ADMIN;
      expect(
        comicsReviewsService.deleteReview('reviewId', adminUser),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw NotFoundException (404), attempt to delete review that doesnt exists, user is not an Admin', async () => {
      comicsReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const user = mockUser();
      user.role = UserRole.USER;
      expect(
        comicsReviewsService.deleteReview('reviewId', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });
});

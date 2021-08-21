import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import Manga from '../../articles/mangas/entities/manga.entity';
import { UserRole } from '../../auth/entities/user-role';
import MangasReview from './entities/mangas-review.entity';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { MangasReviewDto } from './dto/mangas-review.dto';
import { UpdateMangasReviewDto } from './dto/update-mangas-review.dto';
import { MangasReviewsService } from './mangas-reviews.service';
import { MangasRepository } from '../../articles/mangas/mangas.repository';
import { WallsMangasRepository } from '../../walls/walls-mangas/walls-mangas.repository';
import { MangasReviewsRepository } from './mangas-reviews.repository';

const mockMangasReviewsRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForManga: jest.fn(),
  getReviewsForUser: jest.fn(),
});

const mockwallsMangasRepository = () => ({
  checkUserHasStatusesOnManga: jest.fn(),
});

const mockMangasRepository = () => ({
  findOne: jest.fn(),
});

const mockMangaReview = (user?: User, manga?: Manga) => {
  const review = new MangasReview();
  review.user = user;
  review.manga = manga;
  return review;
};

const mockManga = () => {
  return new Manga();
};

const mockUser = () => {
  const user = new User();
  user.username = 'Test';
  return user;
};

describe('MangasReviewsService', () => {
  let mangasReviewsService: MangasReviewsService;
  let mangasReviewsRepository;
  let wallsMangasRepository;
  let mangasRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        MangasReviewsService,
        {
          provide: MangasReviewsRepository,
          useFactory: mockMangasReviewsRepository,
        },
        {
          provide: WallsMangasRepository,
          useFactory: mockwallsMangasRepository,
        },
        {
          provide: MangasRepository,
          useFactory: mockMangasRepository,
        },
      ],
    }).compile();

    mangasReviewsService =
      module.get<MangasReviewsService>(MangasReviewsService);
    mangasReviewsRepository = module.get(MangasReviewsRepository);
    wallsMangasRepository = module.get(WallsMangasRepository);
    mangasRepository = module.get(MangasRepository);
  });

  describe('createReview', () => {
    const reviewDto = new MangasReviewDto();
    reviewDto.review = 'Some Review';
    reviewDto.overall = 1;
    reviewDto.art = 2;
    reviewDto.characters = 3;
    reviewDto.story = 4;
    reviewDto.enjoyment = 5;

    it('throw NotFoundException (404), attempt to create a review for manga that doesnt exist', async () => {
      mangasRepository.findOne.mockResolvedValue(null);

      expect(
        mangasReviewsService.createReview('mangaId', reviewDto, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw ConflictException (409), attempt to create a review for manga that user doesnt have on their wall', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.checkUserHasStatusesOnManga.mockResolvedValue(
        false,
      );

      expect(
        mangasReviewsService.createReview('mangaId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('throw ConflictException (409), attempt to create a review for manga that already have the users review', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.checkUserHasStatusesOnManga.mockResolvedValue(true);
      mangasReviewsRepository.findOne.mockResolvedValue(mockMangaReview());

      expect(
        mangasReviewsService.createReview('mangaId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('return created review, successfully created review', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.checkUserHasStatusesOnManga.mockResolvedValue(true);
      mangasReviewsRepository.findOne.mockResolvedValue(null);
      mangasReviewsRepository.create.mockImplementationOnce((dto: any) => {
        const newReview = mockMangaReview(dto.user, dto.manga);
        newReview.review = dto.review;
        newReview.overall = dto.overall;
        newReview.art = dto.art;
        newReview.characters = dto.characters;
        newReview.story = dto.story;
        newReview.enjoyment = dto.enjoyment;
        return newReview;
      });

      const response = await mangasReviewsService.createReview(
        'mangaId',
        reviewDto,
        mockUser(),
      );

      expect(response).toEqual({
        user: mockUser(),
        manga: mockManga(),
        ...reviewDto,
      });
    });
  });

  describe('getReviews', () => {
    const pagination = new PaginationDto();

    it('For User : total count 0, no prev and next page, no reviews', async () => {
      mangasReviewsRepository.reviewsCount.mockResolvedValue(0);
      mangasReviewsRepository.getReviewsForUser.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await mangasReviewsService.getReviews(
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
      mangasReviewsRepository.reviewsCount.mockResolvedValue(5);
      mangasReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockMangaReview(),
        mockMangaReview(),
        mockMangaReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await mangasReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockMangaReview(), mockMangaReview(), mockMangaReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/manga/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For User : total count 5, has prev page, has next page, has reviews', async () => {
      mangasReviewsRepository.reviewsCount.mockResolvedValue(5);
      mangasReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockMangaReview(),
        mockMangaReview(),
        mockMangaReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await mangasReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockMangaReview(), mockMangaReview(), mockMangaReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/manga/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/manga/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('For Manga : total count 0, no prev and next page, no reviews', async () => {
      mangasReviewsRepository.reviewsCount.mockResolvedValue(0);
      mangasReviewsRepository.getReviewsForManga.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await mangasReviewsService.getReviews(
        pagination,
        'mangaId',
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

    it('For Manga : total count 5, no prev page, has next page, has reviews', async () => {
      mangasReviewsRepository.reviewsCount.mockResolvedValue(5);
      mangasReviewsRepository.getReviewsForManga.mockResolvedValue([
        mockMangaReview(),
        mockMangaReview(),
        mockMangaReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await mangasReviewsService.getReviews(
        pagination,
        'mangaId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockMangaReview(), mockMangaReview(), mockMangaReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/manga/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For Manga : total count 5, has prev page, has next page, has reviews', async () => {
      mangasReviewsRepository.reviewsCount.mockResolvedValue(5);
      mangasReviewsRepository.getReviewsForManga.mockResolvedValue([
        mockMangaReview(),
        mockMangaReview(),
        mockMangaReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await mangasReviewsService.getReviews(
        pagination,
        'mangaId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockMangaReview(), mockMangaReview(), mockMangaReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/manga/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/manga/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });
  });

  describe('updateReview', () => {
    it('throw NotFoundException (404), attempt to update review that doesnt exsit', async () => {
      mangasReviewsRepository.findOne.mockResolvedValue(null);

      expect(
        mangasReviewsService.updateReview('reviewId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return updated review, successfully update review', async () => {
      mangasReviewsRepository.findOne.mockResolvedValue(
        mockMangaReview(mockUser(), mockManga()),
      );
      mangasReviewsRepository.save.mockImplementationOnce(
        (review: any) => review,
      );

      const updateDto = new UpdateMangasReviewDto();
      updateDto.review = 'New Review';
      updateDto.overall = 9;
      updateDto.art = 8;
      updateDto.characters = 7;
      updateDto.story = 6;
      updateDto.enjoyment = 5;

      const response = await mangasReviewsService.updateReview(
        'reviewId',
        updateDto,
        mockUser(),
      );

      expect(response).toEqual({
        manga: mockManga(),
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
      mangasReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const adminUser = mockUser();
      adminUser.role = UserRole.ADMIN;
      expect(
        mangasReviewsService.deleteReview('reviewId', adminUser),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw NotFoundException (404), attempt to delete review that doesnt exists, user is not an Admin', async () => {
      mangasReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const user = mockUser();
      user.role = UserRole.USER;
      expect(
        mangasReviewsService.deleteReview('reviewId', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });
});

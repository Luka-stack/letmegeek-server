import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import User from '../../users/entities/user.entity';
import Game from '../../games/entities/game.entity';
import { UserRole } from '../../auth/entities/user-role';
import GamesReview from './entities/games-review.entity';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { GamesReviewDto } from './dto/games-review.dto';
import { GamesReviewsService } from './games-reviews.service';
import { GamesRepository } from '../../games/games.repository';
import { WallsGamesRepository } from '../../walls/walls-games/walls-games.repository';
import { GamesReviewsRepository } from './games-reviews.repository';
import { UpdateGamesReviewDto } from './dto/update-games-review.dto';

const mockGamesReviewsRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForGame: jest.fn(),
  getReviewsForUser: jest.fn(),
});

const mockWallsGamesRepository = () => ({
  checkUserHasStatusesOnGame: jest.fn(),
});

const mockGamesRepository = () => ({
  findOne: jest.fn(),
});

const mockGameReview = (user?: User, game?: Game) => {
  const review = new GamesReview();
  review.user = user;
  review.game = game;
  return review;
};

const mockGame = () => {
  return new Game();
};

const mockUser = () => {
  const user = new User();
  user.username = 'Test';
  return user;
};

describe('GamesReviewsService', () => {
  let gamesReviewsService: GamesReviewsService;
  let gamesReviewsRepository;
  let wallsGamesRepository;
  let gamesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        GamesReviewsService,
        {
          provide: GamesReviewsRepository,
          useFactory: mockGamesReviewsRepository,
        },
        {
          provide: WallsGamesRepository,
          useFactory: mockWallsGamesRepository,
        },
        {
          provide: GamesRepository,
          useFactory: mockGamesRepository,
        },
      ],
    }).compile();

    gamesReviewsService = module.get<GamesReviewsService>(GamesReviewsService);
    gamesReviewsRepository = module.get(GamesReviewsRepository);
    wallsGamesRepository = module.get(WallsGamesRepository);
    gamesRepository = module.get(GamesRepository);
  });

  describe('createReview', () => {
    const reviewDto = new GamesReviewDto();
    reviewDto.review = 'Some Review';
    reviewDto.overall = 1;
    reviewDto.art = 2;
    reviewDto.characters = 3;
    reviewDto.story = 4;
    reviewDto.enjoyment = 5;
    reviewDto.graphics = 6;
    reviewDto.music = 7;
    reviewDto.voicing = 8;

    it('throw NotFoundException (404), attempt to create a review for game that doesnt exist', async () => {
      gamesRepository.findOne.mockResolvedValue(null);

      expect(
        gamesReviewsService.createReview('gameId', reviewDto, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw ConflictException (409), attempt to create a review for game that user doesnt have on their wall', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.checkUserHasStatusesOnGame.mockResolvedValue(false);

      expect(
        gamesReviewsService.createReview('gameId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('throw ConflictException (409), attempt to create a review for game that already have the users review', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.checkUserHasStatusesOnGame.mockResolvedValue(true);
      gamesReviewsRepository.findOne.mockResolvedValue(mockGameReview());

      expect(
        gamesReviewsService.createReview('gameId', reviewDto, mockUser()),
      ).rejects.toThrowError(ConflictException);
    });

    it('return created review, successfully created review', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.checkUserHasStatusesOnGame.mockResolvedValue(true);
      gamesReviewsRepository.findOne.mockResolvedValue(null);
      gamesReviewsRepository.create.mockImplementationOnce((dto: any) => {
        const newReview = mockGameReview(dto.user, dto.game);
        newReview.review = dto.review;
        newReview.overall = dto.overall;
        newReview.art = dto.art;
        newReview.characters = dto.characters;
        newReview.story = dto.story;
        newReview.enjoyment = dto.enjoyment;
        newReview.graphics = dto.graphics;
        newReview.music = dto.music;
        newReview.voicing = dto.voicing;
        return newReview;
      });

      const response = await gamesReviewsService.createReview(
        'bookId',
        reviewDto,
        mockUser(),
      );

      expect(response).toEqual({
        user: mockUser(),
        game: mockGame(),
        ...reviewDto,
      });
    });
  });

  describe('getReviews', () => {
    const pagination = new PaginationDto();

    it('For User : total count 0, no prev and next page, no reviews', async () => {
      gamesReviewsRepository.reviewsCount.mockResolvedValue(0);
      gamesReviewsRepository.getReviewsForUser.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await gamesReviewsService.getReviews(
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
      gamesReviewsRepository.reviewsCount.mockResolvedValue(5);
      gamesReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockGameReview(),
        mockGameReview(),
        mockGameReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await gamesReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockGameReview(), mockGameReview(), mockGameReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/game/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For User : total count 5, has prev page, has next page, has reviews', async () => {
      gamesReviewsRepository.reviewsCount.mockResolvedValue(5);
      gamesReviewsRepository.getReviewsForUser.mockResolvedValue([
        mockGameReview(),
        mockGameReview(),
        mockGameReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await gamesReviewsService.getReviews(
        pagination,
        undefined,
        'test123',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockGameReview(), mockGameReview(), mockGameReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/game/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/game/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('For Game : total count 0, no prev and next page, no reviews', async () => {
      gamesReviewsRepository.reviewsCount.mockResolvedValue(0);
      gamesReviewsRepository.getReviewsForGame.mockResolvedValue([]);

      pagination.page = 1;
      pagination.limit = 5;

      const response = await gamesReviewsService.getReviews(
        pagination,
        'gameId',
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

    it('For Game : total count 5, no prev page, has next page, has reviews', async () => {
      gamesReviewsRepository.reviewsCount.mockResolvedValue(5);
      gamesReviewsRepository.getReviewsForGame.mockResolvedValue([
        mockGameReview(),
        mockGameReview(),
        mockGameReview(),
      ]);

      pagination.page = 1;
      pagination.limit = 2;

      const response = await gamesReviewsService.getReviews(
        pagination,
        'gameId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockGameReview(), mockGameReview(), mockGameReview()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/game/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('For Game : total count 5, has prev page, has next page, has reviews', async () => {
      gamesReviewsRepository.reviewsCount.mockResolvedValue(5);
      gamesReviewsRepository.getReviewsForGame.mockResolvedValue([
        mockGameReview(),
        mockGameReview(),
        mockGameReview(),
      ]);

      pagination.page = 2;
      pagination.limit = 2;

      const response = await gamesReviewsService.getReviews(
        pagination,
        'gameId',
      );

      expect(response).toEqual({
        totalCount: 5,
        page: pagination.page,
        limit: pagination.limit,
        data: [mockGameReview(), mockGameReview(), mockGameReview()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/game/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/game/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });
  });

  describe('updateReview', () => {
    it('throw NotFoundException (404), attempt to update review that doesnt exsit', async () => {
      gamesReviewsRepository.findOne.mockResolvedValue(null);

      expect(
        gamesReviewsService.updateReview('reviewId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return updated review, successfully update review', async () => {
      gamesReviewsRepository.findOne.mockResolvedValue(
        mockGameReview(mockUser(), mockGame()),
      );
      gamesReviewsRepository.save.mockImplementationOnce(
        (review: any) => review,
      );

      const updateDto = new UpdateGamesReviewDto();
      updateDto.review = 'New Review';
      updateDto.overall = 9;
      updateDto.art = 8;
      updateDto.characters = 7;
      updateDto.story = 6;
      updateDto.enjoyment = 5;
      updateDto.graphics = 4;
      updateDto.music = 3;
      updateDto.voicing = 2;

      const response = await gamesReviewsService.updateReview(
        'reviewId',
        updateDto,
        mockUser(),
      );

      expect(response).toEqual({
        game: mockGame(),
        user: mockUser(),
        review: updateDto.review,
        overall: updateDto.overall,
        art: updateDto.art,
        characters: updateDto.characters,
        story: updateDto.story,
        enjoyment: updateDto.enjoyment,
        graphics: updateDto.graphics,
        music: updateDto.music,
        voicing: updateDto.voicing,
      });
    });
  });

  describe('deleteReviews', () => {
    it('throw NotFoundException (404), attempt to delete review that doesnt exists, user is an Admin', async () => {
      gamesReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const adminUser = mockUser();
      adminUser.role = UserRole.ADMIN;
      expect(
        gamesReviewsService.deleteReview('reviewId', adminUser),
      ).rejects.toThrowError(NotFoundException);
    });

    it('throw NotFoundException (404), attempt to delete review that doesnt exists, user is not an Admin', async () => {
      gamesReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      const user = mockUser();
      user.role = UserRole.USER;
      expect(
        gamesReviewsService.deleteReview('reviewId', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });
});

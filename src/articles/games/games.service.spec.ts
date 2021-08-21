import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import Game from './entities/game.entity';
import User from '../../users/entities/user.entity';
import WallsGame from '../../walls/walls-games/entities/walls-game.entity';
import { UserRole } from '../../auth/entities/user-role';
import { slugify } from '../../utils/helpers';
import { GamesRepository } from './games.repository';
import { GamesService } from './games.service';
import { GamesFilterDto } from './dto/games-filter.dto';

const mockGamesRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  getGames: jest.fn(),
  getFilterCount: jest.fn(),
  getCompleteGame: jest.fn(),
});

const mockGame = () => {
  return {
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'title_slug',
    identifier: '80Vni9G',
    title: 'Title Slug',
    gears: 'PlayStation 5',
    createdAt: new Date(),
    updatedAt: new Date(),
    draft: false,
    wallsGames: [],
  };
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('GamesService', () => {
  let gamesService: GamesService;
  let gamesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        GamesService,
        { provide: GamesRepository, useFactory: mockGamesRepository },
      ],
    }).compile();

    gamesService = module.get<GamesService>(GamesService);
    gamesRepository = module.get(GamesRepository);
  });

  describe('createGame', () => {
    it('call GamesRepository.create as a normal user; save, create and return Game', async () => {
      // given
      const game = mockGame();
      game.createdAt = null;
      gamesRepository.create.mockReturnValue(game);
      gamesRepository.save.mockResolvedValue({});

      // when
      const result = await gamesService.createGame(game, mockUser());

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(game.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: game.title,
        draft: true,
        gears: game.gears,
        wallsGames: [],
      });
    });

    it('call GamesRepository.create as a normal admin; save, create and return Game', async () => {
      // given
      const game = mockGame();
      game.createdAt = null;
      gamesRepository.create.mockReturnValue(game);
      gamesRepository.save.mockResolvedValue({});

      // when
      const result = await gamesService.createGame(game, mockUser());

      // then
      expect(result).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(game.title),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        title: game.title,
        draft: game.draft,
        gears: game.gears,
        wallsGames: [],
      });
    });

    it('calls GamesRepository.create and save, returns 409 since Title is not unique', async () => {
      // given
      gamesRepository.create.mockReturnValue(mockGame());
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        gamesService.createGame(mockGame(), mockUser()),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('getMangas', () => {
    const gamesFilter = new GamesFilterDto();

    const user = mockUser();
    const game = mockGame();
    const wallsGame = new WallsGame();
    wallsGame.username = user.username;
    wallsGame.score = 5;
    game.wallsGames = [wallsGame];

    it('return paginated data : total count 0, no prev, no next, no games', async () => {
      gamesRepository.getFilterCount.mockResolvedValue(0);
      gamesRepository.getGames.mockResolvedValue([]);

      gamesFilter.page = 0;
      gamesFilter.limit = 1;

      const response = await gamesService.getGames(gamesFilter, mockUser());

      expect(response).toEqual({
        totalCount: 0,
        page: gamesFilter.page,
        limit: gamesFilter.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return paginated data : total count 2, no prev page, has next page, has games', async () => {
      gamesRepository.getFilterCount.mockResolvedValue(2);
      gamesRepository.getGames.mockResolvedValue([game, game]);

      gamesFilter.page = 0;
      gamesFilter.limit = 1;

      const response = await gamesService.getGames(gamesFilter, mockUser());

      expect(response).toEqual({
        totalCount: 2,
        page: gamesFilter.page,
        limit: gamesFilter.limit,
        data: [game, game],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/game/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('return paginated data : total count 3, has prev page, has next page, has game', async () => {
      gamesRepository.getFilterCount.mockResolvedValue(3);
      gamesRepository.getGames.mockResolvedValue([game, game, game]);

      gamesFilter.page = 2;
      gamesFilter.limit = 1;

      const response = await gamesService.getGames(gamesFilter, user);

      expect(response).toEqual({
        totalCount: 3,
        page: gamesFilter.page,
        limit: gamesFilter.limit,
        data: [game, game, game],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/games/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/games/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('call GamesRepository.getGames as a user, return array of games with users wallsGame', async () => {
      gamesFilter.page = 1;
      gamesFilter.limit = 1;

      // given
      gamesRepository.getFilterCount.mockResolvedValue(1);
      gamesRepository.getGames.mockResolvedValue([game]);

      // when
      const result = await gamesService.getGames(gamesFilter, user);

      // then
      expect(result.data).toEqual([game]);
      expect(result.data[0].userWallsGame).toEqual(wallsGame);
    });
  });

  describe('getOneBook', () => {
    const game = mockGame();
    const user = mockUser();
    const wallsGame = new WallsGame();
    wallsGame.username = user.username;
    wallsGame.score = 5;
    game.wallsGames = [wallsGame];

    it('call GamesRepository.getOneGame, return book', async () => {
      // given
      gamesRepository.getCompleteGame.mockResolvedValue(game);

      // when
      const result = await gamesService.getOneGame('identifier', 'slug', null);

      // then
      expect(result).toEqual(game);
    });

    it('call GamesRepository.getOneGame as a user, return game with users wallsgame', async () => {
      // given
      gamesRepository.getCompleteGame.mockResolvedValue(game);

      // when
      const result = await gamesService.getOneGame('identifier', 'slug', user);

      // then
      expect(result).toEqual(game);
      expect(result.userWallsGame).toEqual(wallsGame);
    });

    it('call GamesRepository.getOneGame, return 404', async () => {
      // given
      gamesRepository.getCompleteGame.mockResolvedValue(null);

      // when, then
      expect(
        gamesService.getOneGame('someId', 'slug', null),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateGame', () => {
    const game = mockGame();
    const gameClass = new Game();

    it('call GamesRepository.findOne and return 404', async () => {
      // given
      gamesRepository.findOne.mockResolvedValue(null);

      expect(
        gamesService.updateGame('someId', 'someSlug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('call GamesRepository.findOne, find Game then call GamesRepository.save, update and return Game', async () => {
      // given
      gameClass.title = game.title;
      gamesRepository.findOne.mockResolvedValue(gameClass);
      gamesRepository.save.mockResolvedValue(gameClass);

      // when
      const updateGame = {
        title: 'updatedTitle',
        premiered: new Date(),
      };
      const result = await gamesService.updateGame(
        game.identifier,
        game.slug,
        updateGame,
      );

      // then
      expect(result).toEqual({
        title: updateGame.title,
        premiered: updateGame.premiered,
      });
    });

    it('call GamesRepository.findOne, find Game then call GamesRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      gameClass.title = game.title;
      gameClass.createdAt = date;
      gamesRepository.findOne.mockResolvedValue(gameClass);
      gamesRepository.save.mockResolvedValue(gameClass);

      // when
      const updateGame = {
        draft: true,
      };
      const result = await gamesService.updateGame(
        game.identifier,
        game.slug,
        updateGame,
      );

      // then
      expect(result.createdAt).not.toEqual(date);
    });

    it('call GamesRepository.findOne, find Game then call GamesRepository.save, draft and timestamp doesnt change', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      gameClass.title = game.title;
      gameClass.createdAt = date;
      gamesRepository.findOne.mockResolvedValue(gameClass);
      gamesRepository.save.mockResolvedValue(gameClass);

      // when
      const updateGame = {
        completeTime: 23,
      };
      const result = await gamesService.updateGame(
        game.identifier,
        game.slug,
        updateGame,
      );

      // then
      expect(result.createdAt).toEqual(date);
    });

    it('call GamesRepository.findOne, find Game then call GamesRepository.save and throw 409 due to not unique Title', async () => {
      // given
      gameClass.title = game.title;
      gamesRepository.findOne.mockResolvedValue(gameClass);
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        gamesService.updateGame(game.identifier, game.slug, {}),
      ).rejects.toThrowError(ConflictException);
    });
  });

  describe('deleteGame', () => {
    it('call GamesRepository.delete, throws 404', async () => {
      // given
      gamesRepository.delete.mockResolvedValue({ affected: 0 });

      // when then
      expect(gamesService.deleteGame('someId', 'someSlug')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('call GamesRepository.delete, delet Manga and return void', async () => {
      // given
      gamesRepository.delete.mockResolvedValue({ affected: 1 });

      // when then
      expect(gamesService.deleteGame('someId', 'someSlug')).resolves
        .toHaveBeenCalled;
    });
  });
});

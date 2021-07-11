import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import Game from './entities/game.entity';
import User from '../users/entities/user.entity';
import WallsGame from '../walls/walls-games/entities/walls-game.entity';
import { UserRole } from '../auth/entities/user-role';
import { slugify } from '../utils/helpers';
import { GamesRepository } from './games.repository';
import { GamesService } from './games.service';

const mockGamesRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  getGames: jest.fn(),
  getCompleteGame: jest.fn(),
  delete: jest.fn(),
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
      expect(gamesService.createGame(mockGame(), null)).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getMangas', () => {
    const user = mockUser();
    const game = mockGame();
    const wallsGame = new WallsGame();
    wallsGame.username = user.username;
    wallsGame.score = 5;
    game.wallsGames = [wallsGame];

    it('call GamesRepository.getGames, return array of games', async () => {
      // gien
      gamesRepository.getGames.mockResolvedValue([game]);

      // when
      const result = await gamesService.getGames(null, null);

      // then
      expect(result).toEqual([game]);
    });

    it('call GamesRepository.getGames as a user, return array of games with users wallsGame', async () => {
      // gien
      gamesRepository.getGames.mockResolvedValue([game]);

      // when
      const result = await gamesService.getGames(null, user);

      // then
      expect(result).toEqual([game]);
      expect(result[0].userWallsGame).toEqual(wallsGame);
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

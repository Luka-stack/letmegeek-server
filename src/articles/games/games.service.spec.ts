import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import Game from './entities/game.entity';
import User from '../../users/entities/user.entity';
import { UserRole } from '../../auth/entities/user-role';
import { GamesRepository } from './games.repository';
import { GamesService } from './games.service';
import { GamesFilterDto } from './dto/games-filter.dto';
import { allWallArticleStatusesModes } from '../../walls/entities/wall-article-status';
import { UpdateGameDto } from './dto/update-game.dto';

const mockGamesRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  getGame: jest.fn(),
  getGames: jest.fn(),
  getFilterCount: jest.fn(),
});

const mockGame = () => {
  const game = new Game();
  game.id = '643790b4-ad59-49dc-baec-f5617e700bac';
  game.slug = 'title_slug';
  game.identifier = '80Vni9G';
  game.title = 'Title Slug';
  game.gears = 'PlayStation 5';
  game.updatedAt = new Date();
  game.draft = false;
  return game;
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
      const user = mockUser();
      gamesRepository.create.mockReturnValue(game);
      gamesRepository.save.mockResolvedValue(game);

      // when
      const result = await gamesService.createGame(game, user);

      // then
      const expectedGame = mockGame();
      expectedGame.contributor = user.username;
      expectedGame.draft = true;
      expectedGame.accepted = false;
      expectedGame.createdAt = result.createdAt;
      expectedGame.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedGame);
    });

    it('call GamesRepository.create as a normal admin; save, create and return Game', async () => {
      // given
      const game = mockGame();
      gamesRepository.create.mockReturnValue(game);
      gamesRepository.save.mockResolvedValue(game);

      // when
      const user = mockUser();
      user.role = UserRole.ADMIN;
      const result = await gamesService.createGame(game, user);

      // then
      const expectedGame = mockGame();
      expectedGame.contributor = user.username;
      expectedGame.accepted = !expectedGame.draft;
      expectedGame.createdAt = result.createdAt;
      expectedGame.updatedAt = result.updatedAt;
      expect(result.createdAt).toEqual(expect.any(Date));
      expect(result.updatedAt).toEqual(expect.any(Date));
      expect(result).toEqual(expectedGame);
    });

    it('calls GamesRepository.create and save, returns 409 since Title is not unique', async () => {
      // given
      const game = mockGame();
      gamesRepository.create.mockReturnValue(game);
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(gamesService.createGame(game, mockUser())).rejects.toThrowError(
        ConflictException,
      );
    });
  });

  describe('getMangas', () => {
    const gamesFilter = new GamesFilterDto();
    const user = mockUser();

    const game = {
      game_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      game_slug: 'title_test',
      game_identifier: '80Vni9G',
      game_title: 'Title Test',
      game_draft: false,
      game_createdAt: new Date(),
      game_updatedAt: new Date(),
      game_imageUrl: 'image Path',
      gameStats_avgScore: '5',
      gameStats_countScore: '5',
      gameStats_members: '5',
    };

    const gameWithUsersScoring = {
      game_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      game_slug: 'title_test',
      game_identifier: '80Vni9G',
      game_title: 'Title Test',
      game_draft: false,
      game_createdAt: new Date(),
      game_updatedAt: new Date(),
      game_imageUrl: 'image Path',
      gameStats_avgScore: '5',
      gameStats_countScore: '5',
      gameStats_members: '5',
      wallGame_status: allWallArticleStatusesModes()[0],
      wallGame_score: '5',
    };

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

    it('call GamesRepository.getGames as a user, return array of games with statistics', async () => {
      gamesFilter.page = 1;
      gamesFilter.limit = 1;

      // given
      gamesRepository.getFilterCount.mockResolvedValue(1);
      gamesRepository.getGames.mockResolvedValue([game]);

      // when
      const result = await gamesService.getGames(gamesFilter, user);

      // then
      expect(result.data.length).toEqual(1);
      expect(result.data).toEqual([game]);
    });

    it('call GamesRepository.getGames as a user, return array of games with statistics and users score', async () => {
      gamesFilter.page = 1;
      gamesFilter.limit = 1;

      // given
      gamesRepository.getFilterCount.mockResolvedValue(1);
      gamesRepository.getGames.mockResolvedValue([game, gameWithUsersScoring]);

      // when
      const result = await gamesService.getGames(gamesFilter, user);

      // then
      expect(result.data.length).toEqual(2);
      expect(result.data[0]).toEqual(game);
      expect(result.data[1]).toEqual(gameWithUsersScoring);
    });
  });

  describe('getOneBook', () => {
    const user = mockUser();

    const game = {
      game_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      game_slug: 'title_test',
      game_identifier: '80Vni9G',
      game_title: 'Title Test',
      game_draft: false,
      game_createdAt: new Date(),
      game_updatedAt: new Date(),
      game_imageUrl: 'image Path',
      gameStats_avgScore: '5',
      gameStats_countScore: '5',
      gameStats_members: '5',
    };

    const gameWithUsersScoring = {
      game_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      game_slug: 'title_test',
      game_identifier: '80Vni9G',
      game_title: 'Title Test',
      game_draft: false,
      game_createdAt: new Date(),
      game_updatedAt: new Date(),
      game_imageUrl: 'image Path',
      gameStats_avgScore: '5',
      gameStats_countScore: '5',
      gameStats_members: '5',
      wallGame_status: allWallArticleStatusesModes()[0],
      wallGame_score: '5',
    };

    it('call GamesRepository.getOneGame, return  with statistics', async () => {
      // given
      gamesRepository.getGame.mockResolvedValue(game);

      // when
      const result = await gamesService.getOneGame('identifier', 'slug', user);

      // then
      expect(result).toEqual(game);
    });

    it('call GamesRepository.getOneGame as a user, return game with users score', async () => {
      // given
      gamesRepository.getGame.mockResolvedValue(gameWithUsersScoring);

      // when
      const result = await gamesService.getOneGame('identifier', 'slug', user);

      // then
      expect(result).toEqual(gameWithUsersScoring);
    });

    it('call GamesRepository.getOneGame, return 404', async () => {
      // given
      gamesRepository.getGame.mockResolvedValue(null);

      // when, then
      expect(
        gamesService.getOneGame('someId', 'slug', user),
      ).rejects.toThrowError(NotFoundException);
    });
  });

  describe('updateGame', () => {
    const game = mockGame();

    it('call GamesRepository.findOne and return 404', async () => {
      // given
      gamesRepository.findOne.mockResolvedValue(null);

      expect(
        gamesService.updateGame('someId', 'someSlug', {}),
      ).rejects.toThrowError(NotFoundException);
    });

    it('call GamesRepository.findOne, find Game then call GamesRepository.save, update and return Game', async () => {
      // given
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue(game);

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
      expect(result).toEqual(game);
    });

    it('call GamesRepository.findOne, find Game, validate authors, publishers and genres', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue(game);

      // when
      const updatedGame = {
        authors: 'Test1, Test1, Test1',
        publishers: 'Test2, Test2, Test2',
        genres: 'Test3, Test3, Test3',
      };
      const result = await gamesService.updateGame(
        game.identifier,
        game.slug,
        updatedGame,
      );

      // then
      expect(result.authors).toEqual(updatedGame.authors.replace(' ', ''));
      expect(result.publishers).toEqual(
        updatedGame.publishers.replace(' ', ''),
      );
      expect(result.genres).toEqual(updatedGame.genres.replace(' ', ''));
    });

    it('call GamesRepository.findOne, find Game then call GamesRepository.save, update draft to true and update timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue(game);

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
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue(game);

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
      expect(result.createdAt).toEqual(game.createdAt);
    });

    it('call GamesRepository.findOne, find Game then call GamesRepository.save and throw 409 due to not unique Title', async () => {
      // given
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      expect(
        gamesService.updateGame(
          game.identifier,
          game.slug,
          new UpdateGameDto(),
        ),
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

    // it('call GamesRepository.delete, delet Manga and return void', async () => {
    //   // given
    //   gamesRepository.delete.mockResolvedValue({ affected: 1 });

    //   // when then
    //   expect(gamesService.deleteGame('someId', 'someSlug')).resolves
    //     .toHaveBeenCalled;
    // });
  });
});

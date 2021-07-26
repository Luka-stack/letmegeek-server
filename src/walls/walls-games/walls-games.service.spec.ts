import { Test, TestingModule } from '@nestjs/testing';

import Game from '../../games/entities/game.entity';
import User from '../../users/entities/user.entity';
import WallsGame from './entities/walls-game.entity';
import { UserRole } from '../../auth/entities/user-role';
import { WallsGameDto } from './dto/walls-game.dto';
import { WallArticleStatus } from '../entities/wall-article-status';
import { GamesRepository } from '../../games/games.repository';
import { WallsGamesRepository } from './walls-games.repository';
import { WallsGamesService } from './walls-games.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

const mockWallsGameRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  getRecords: jest.fn(),
  findUserRecordByGame: jest.fn(),
});

const mockGamesRepository = () => ({
  findOne: jest.fn(),
});

const wallsGameDto = () => {
  const wallsGame = new WallsGameDto();
  wallsGame.status = WallArticleStatus.COMPLETED;
  return wallsGame;
};

const mockWallsGame = (user?: User, game?: Game) => {
  const wall = new WallsGame();
  wall.user = user;
  wall.game = game;
  wall.status = WallArticleStatus.COMPLETED;
  return wall;
};

const mockGame = () => {
  return new Game();
};

const mockUser = () => {
  const user = new User();
  user.email = 'test@test.com';
  user.username = 'TestUser';
  user.role = UserRole.USER;
  return user;
};

describe('WallsGamesService', () => {
  let wallsGamesService: WallsGamesService;
  let wallsGamesRepository;
  let gamesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WallsGamesService,
        { provide: WallsGamesRepository, useFactory: mockWallsGameRepository },
        { provide: GamesRepository, useFactory: mockGamesRepository },
      ],
    }).compile();

    wallsGamesService = module.get<WallsGamesService>(WallsGamesService);
    wallsGamesRepository = module.get(WallsGamesRepository);
    gamesRepository = module.get(GamesRepository);
  });

  describe('createRecord', () => {
    it('throw NotFoundException (404), provided wrong games identifier', async () => {
      gamesRepository.findOne.mockResolvedValue(null);

      expect(
        wallsGamesService.createRecord('gameId', null, mockUser()),
      ).rejects.toThrow(NotFoundException);
    });

    it('throw ConflictException (409), provided game already regstered in users wallsgame', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.findOne.mockResolvedValue(mockWallsGame());

      expect(
        wallsGamesService.createRecord('bookId', wallsGameDto(), mockUser()),
      ).rejects.toThrow(ConflictException);
    });

    it('successfully create new record', async () => {
      const game = mockGame();
      const user = mockUser();
      const wallDto = mockWallsGame(user, game);
      wallDto.hoursPlayed = 50;

      gamesRepository.findOne.mockResolvedValue(game);
      wallsGamesRepository.findOne.mockResolvedValue(null);
      wallsGamesRepository.create.mockImplementation((newObject) => {
        const wall = new WallsGame();
        wall.user = newObject.user;
        wall.game = newObject.game;
        wall.hoursPlayed = newObject.hoursPlayed;
        return wall;
      });

      const response = await wallsGamesService.createRecord(
        'gameId',
        wallDto,
        user,
      );

      expect(response.game).toEqual(game);
      expect(response.user).toEqual(user);
      expect(response.hoursPlayed).toEqual(wallDto.hoursPlayed);
    });
  });

  describe('updateRecords', () => {
    it('throw NotFoundException (404), provided wring games identifier', async () => {
      wallsGamesRepository.findOne.mockResolvedValue(null);

      expect(
        wallsGamesService.updateRecord('gameId', null, mockUser()),
      ).rejects.toThrowError(NotFoundException);
    });

    it('update record related to provided games identifier', async () => {
      const wallsGame = mockWallsGame(mockUser(), mockGame());
      const updateDto = {
        score: 7,
        hoursPlayed: 52,
        status: WallArticleStatus.IN_PLANS,
        startedAt: new Date(),
        finishedAt: new Date(),
      };

      wallsGamesRepository.findUserRecordByGame.mockResolvedValue(wallsGame);
      wallsGamesRepository.save.mockImplementation((saved) => {
        return saved;
      });

      const response = await wallsGamesService.updateRecord(
        'bookId',
        updateDto,
        mockUser(),
      );

      expect(response.score).toEqual(updateDto.score);
      expect(response.status).toEqual(updateDto.status);
      expect(response.hoursPlayed).toEqual(updateDto.hoursPlayed);
      expect(response.startedAt).toEqual(updateDto.startedAt);
      expect(response.finishedAt).toEqual(updateDto.finishedAt);
      expect(response.user).toEqual(wallsGame.user);
      expect(response.game).toEqual(wallsGame.game);
    });
  });

  describe('deleteRecord', () => {
    it('throw NotFoundException (404), provided wrong games identifier', async () => {
      wallsGamesRepository.findOne.mockResolvedValue(null);

      expect(
        wallsGamesService.deleteRecord('gameId', mockUser()),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getRecordsByUser', () => {
    it('return list of WallsGame', async () => {
      wallsGamesRepository.getRecords.mockResolvedValue([mockWallsGame()]);

      const response = await wallsGamesService.getRecordsByUser(
        'username',
        null,
      );

      expect(response).toEqual([mockWallsGame()]);
    });
  });
});

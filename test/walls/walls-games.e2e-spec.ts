import {
  ExecutionContext,
  UnauthorizedException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';

import { WallArticleStatus } from '../../src/walls/entities/wall-article-status';
import Game from '../../src/articles/games/entities/game.entity';
import { GamesRepository } from '../../src/articles/games/games.repository';
import { UserRole } from '../../src/auth/entities/user-role';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import User from '../../src/users/entities/user.entity';
import WallsGame from '../../src/walls/walls-games/entities/walls-game.entity';
import { WallsGamesController } from '../../src/walls/walls-games/walls-games.controller';
import { WallsGamesRepository } from '../../src/walls/walls-games/walls-games.repository';
import { WallsGamesService } from '../../src/walls/walls-games/walls-games.service';

const mockGamesRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsGamesRepository = () => ({
  create: jest.fn((dto) => {
    const wallsGame = new WallsGame();
    wallsGame.status = dto.status;
    wallsGame.username = dto.user.username;
    wallsGame.game = dto.game;
    wallsGame.hoursPlayed = dto.hoursPlayed;
    wallsGame.finishedAt = dto.finishedAt;
    wallsGame.startedAt = dto.startedAt;
    wallsGame.score = dto.score;
    return wallsGame;
  }),
  findUserRecordByGame: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  getRecords: jest.fn(),
  delete: jest.fn(),
});

const mockUser = (role: string) => {
  const user = new User();
  user.username = 'Tester';
  user.email = 'Tester@lmg.com';

  if (role === 'Admin') {
    user.role = UserRole.ADMIN;
  } else if (role === 'Moderator') {
    user.role = UserRole.MODERATOR;
  } else {
    user.role = UserRole.USER;
  }

  return user;
};

const mockGame = () => {
  const game = new Game();
  game.title = 'Mock Game';
  return game;
};

const mockJwtGuard = {
  canActivate: jest.fn((context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const cookieUser = context.switchToHttp().getRequest().headers.cookie;
    if (!cookieUser) {
      throw new UnauthorizedException();
    }

    req.user = mockUser(cookieUser);

    return true;
  }),
};

describe('WallsGamesController (e2e)', () => {
  let app: INestApplication;
  let wallsGamesRepository;
  let gamesRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WallsGamesController],
      providers: [
        WallsGamesService,
        { provide: WallsGamesRepository, useFactory: mockWallsGamesRepository },
        { provide: GamesRepository, useFactory: mockGamesRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    gamesRepository = moduleFixture.get(GamesRepository);
    wallsGamesRepository = moduleFixture.get(WallsGamesRepository);

    await app.init();
  });

  describe('/api/wallsgames/game/:gameIdentifier (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: empty status; wallsgame record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ status: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: score not a number; wallsgame record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallsgame record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({
          status: WallArticleStatus.COMPLETED,
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallsgame record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: hoursPlayed not a number; wallsgame record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, hoursPlayed: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created wallsgame record; return 201', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.findOne.mockResolvedValue(null);
      wallsGamesRepository.save.mockResolvedValue({});

      const createDto = {
        status: WallArticleStatus.COMPLETED,
        hoursPlayed: 123,
        finishedAt: new Date(),
        startedAt: new Date(),
        score: 5,
      };

      const result = await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentiifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        game: { title: mockGame().title },
        username: mockUser('User').username,
        status: createDto.status,
        hoursPlayed: createDto.hoursPlayed,
        finishedAt: createDto.finishedAt.toISOString(),
        startedAt: createDto.startedAt.toISOString(),
        score: createDto.score,
      });
    });

    it('Throw NotFoundException (404); game not found', async () => {
      gamesRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); wallsgame for provided game already exists', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.findOne.mockResolvedValue(new WallsGame());

      await request(app.getHttpServer())
        .post('/api/wallsgames/game/gameIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/wallsgames/:username (GET)', () => {
    it('Return wallsgame records for given user', async () => {
      const wallsGame = new WallsGame();
      wallsGame.status = WallArticleStatus.DROPPED;
      wallsGame.game = mockGame();

      wallsGamesRepository.getRecords.mockResolvedValue([wallsGame]);

      const result = await request(app.getHttpServer())
        .get('/api/wallsgames/Tester')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([wallsGame]);
    });
  });

  describe('/api/wallsgames/game/:gameIdentifier (PATCH)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsgames/game/gameIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: score not a number; wallsgame record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallsgame record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallsgame record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: hoursPlayed not a number; wallsgame record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsgames/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ hoursPlayed: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated wallsgame record; return 200', async () => {
      const wallsGame = new WallsGame();
      wallsGame.status = WallArticleStatus.IN_PLANS;
      wallsGame.hoursPlayed = 0;
      wallsGame.score = 0;

      wallsGamesRepository.findUserRecordByGame.mockResolvedValue(wallsGame);
      wallsGamesRepository.save.mockImplementationOnce((wall) => wall);

      const updateDto = {
        status: WallArticleStatus.COMPLETED,
        hoursPlayed: 100,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/wallsgames/game/gameIdentiifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.status).toEqual(updateDto.status);
      expect(result.body.hoursPlayed).toEqual(updateDto.hoursPlayed);
      expect(result.body.score).toEqual(wallsGame.score);
    });

    it('Throw NotFoundException (404); wallsgame record not found', async () => {
      wallsGamesRepository.findUserRecordByGame.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/wallsgames/game/gameIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('/api/wallsgames/game/:gameIdentifier (DELETE)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/wallsgames/game/gameIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404); wallsgame record not found', async () => {
      wallsGamesRepository.findUserRecordByGame.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/wallsgames/game/gameIdentiifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw NotFoundException (404); wallsgame record not found', async () => {
      wallsGamesRepository.findUserRecordByGame.mockResolvedValue(
        new WallsGame(),
      );

      await request(app.getHttpServer())
        .delete('/api/wallsgames/game/gameIdentiifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

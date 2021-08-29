import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import User from '../../src/users/entities/user.entity';
import Game from '../../src/articles/games/entities/game.entity';
import { UserRole } from '../../src/auth/entities/user-role';
import { GameModes } from '../../src/articles/games/entities/game-mode';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../../src/auth/guards/jwt.strategy';
import { GamesController } from '../../src/articles/games/games.controller';
import { GamesService } from '../../src/articles/games/games.service';
import { GamesRepository } from '../../src/articles/games/games.repository';

const mockGamesRepository = () => ({
  create: jest.fn((dto) => {
    const game = new Game();
    game.draft = dto.draft;
    game.title = dto.title;
    return game;
  }),
  save: jest.fn(),
  getFilterCount: jest.fn(),
  getGames: jest.fn(),
  getGame: jest.fn(),
  findOne: jest.fn(),
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

const mockJwtGuard = {
  canActivate: jest.fn((context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();

    const cookieUser = context.switchToHttp().getRequest().headers.cookie;
    req.user = mockUser(cookieUser);

    return true;
  }),
};

describe('GamesController (e2e)', () => {
  let app: INestApplication;
  let gamesRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [GamesController],
      providers: [
        GamesService,
        { provide: GamesRepository, useFactory: mockGamesRepository },
        {
          provide: JwtStrategy,
          useValue: jest.fn().mockImplementation(() => false),
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    gamesRepository = moduleFixture.get(GamesRepository);

    await app.init();
  });

  describe('/api/articles/games (POST)', () => {
    it('Body Validation: empty body; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty title; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        .send({ draft: false })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty draft; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: draft not a boolean; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ draft: true, title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: completeTime not a number; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ draft: true, title: 123, completeTime: 'asdasd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: gameMode not a GameMode; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ draft: true, title: 123, gameMode: 'Super Game Mode' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: gears not a string; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ draft: true, title: 123, gears: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, description: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt create game; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created game only with title and draft in body; return 201', async () => {
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/games')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Body Validation: created game with all data passed; return 201', async () => {
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/games')
        .set('Cookie', 'User')
        .send({
          title: 'Test',
          draft: true,
          gameMode: GameModes.FREE_TO_PLAY,
          completeTime: 123,
          gears: 'PC',
          description: 'Desc',
          genres: '1, 2, 3',
          authors: '11, 22, 33',
          publishers: '111, 222, 333',
          premiered: '2008-09-22',
        })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Authentication: run by User; create draft game; return 201', async () => {
      gamesRepository.save.mockResolvedValue({});
      const user = mockUser('User');

      const result = await request(app.getHttpServer())
        .post('/api/articles/games')
        .set('Cookie', 'User')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(true);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(false);
    });

    it('Authentication: run by Admin; create draft game; return 201', async () => {
      gamesRepository.save.mockResolvedValue({});
      const user = mockUser('Admin');

      const result = await request(app.getHttpServer())
        .post('/api/articles/games')
        .set('Cookie', 'Admin')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('Authentication: run by Moderator; create draft game; return 201', async () => {
      gamesRepository.save.mockResolvedValue({});
      const user = mockUser('Moderator');

      const result = await request(app.getHttpServer())
        .post('/api/articles/games')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .post('/api/articles/games')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/games (GET)', () => {
    const game = {
      game_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      game_slug: 'title_test',
      game_identifier: '80Vni9G',
      game_title: 'Title Test',
      game_draft: false,
      game_gameMode: GameModes.FREE_TO_PLAY,
      game_completeTime: 123,
      game_gears: 'PC',
      game_imageUrl: 'image Path',
      gameStats_avgScore: '5',
      gameStats_countScore: '5',
      gameStats_members: '5',
    };

    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/games')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/games?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/games?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: completeTime not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/games?page=1&limit=5&completeTime=qweqweasd')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: premiered not a 4 digit long number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/games?page=1&limit=5&premiered=12')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: orderBy not an article name; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/games?page=1&limit=5&orderBy=123')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      gamesRepository.getFilterCount.mockResolvedValue(1);
      gamesRepository.getGames.mockResolvedValue([game]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/articles/games?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [game],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      gamesRepository.getFilterCount.mockResolvedValue(3);
      gamesRepository.getGames.mockResolvedValue([game]);

      const result = await request(app.getHttpServer())
        .get(
          '/api/articles/games?page=2&limit=1&orderBy=avgScore&ordering=ASC&name=test123',
        )
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [game],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(result.body.nextPage).toMatch(/page=3/);
      expect(result.body.nextPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/orderBy=avgScore/);
      expect(result.body.nextPage).toMatch(/ordering=ASC/);
      expect(result.body.nextPage).toMatch(/name=test123/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/orderBy=avgScore/);
      expect(result.body.prevPage).toMatch(/ordering=ASC/);
      expect(result.body.prevPage).toMatch(/name=test123/);
    });
  });

  describe('/api/articles/games/:identifier/:slug (GET)', () => {
    const game = {
      game_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      game_slug: 'title_test',
      game_identifier: '80Vni9G',
      game_title: 'Title Test',
      game_draft: false,
      game_gameMode: GameModes.FREE_TO_PLAY,
      game_completeTime: 123,
      game_gears: 'PC',
      game_imageUrl: 'image Path',
      gameStats_avgScore: '5',
      gameStats_countScore: '5',
      gameStats_members: '5',
    };

    it('return 404 - NotFoundException, game not found', async () => {
      gamesRepository.getGame.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/articles/games/gameId/gameSlug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 200 - return game', async () => {
      gamesRepository.getGame.mockResolvedValue(game);

      const result = await request(app.getHttpServer())
        .get('/api/articles/games/gameId/gameSlug')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual(game);
    });
  });

  describe('/api/articles/games/:identifier/:slug (PATCH)', () => {
    const game = new Game();
    game.title = 'Old Title';
    game.draft = false;

    it('Authentication: run by User; forbidden; return 403', async () => {
      gamesRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can update game; return 200', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Authentication: run by Moderator; can update game; return 200', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Moderator')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Body Validation: draft not a boolean; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: completeTime not a number; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ completeTime: 'asdasd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: gameMode not a GameMode; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ gameMode: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: gears not a string; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ gears: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ description: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt update game; return 400', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send({ premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated game with all data passed; return 201', async () => {
      gamesRepository.findOne.mockImplementationOnce(() => {
        const game = new Game();
        game.title = 'TT';
        game.draft = false;
        game.completeTime = 1;
        game.gameMode = `${GameModes.BUY_TO_PLAY}`;
        game.gears = 'PC';
        game.description = 'TT';
        game.genres = 'TT';
        game.authors = 'TT';
        game.publishers = 'TT';
        game.premiered = new Date();
        return game;
      });
      gamesRepository.save.mockResolvedValue({});

      const updated = {
        title: 'Test',
        draft: true,
        completeTime: 12,
        gameMode: `${GameModes.BUY_TO_PLAY}, ${GameModes.SINGLE_PLAYER}`,
        gears: 'PS4',
        description: 'Desc',
        genres: '1, 2, 3',
        authors: '11, 22, 33',
        publishers: '111, 222, 333',
        premiered: '2008-09-22',
      };

      const result = await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .send(updated)
        .expect('Content-Type', /json/)
        .expect(200);

      updated.genres = '1,2,3';
      updated.authors = '11,22,33';
      updated.publishers = '111,222,333';

      expect(result.body).toEqual({
        createdAt: expect.any(String),
        ...updated,
      });
    });

    it('return 404 - NotFoundException, game not found', async () => {
      gamesRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      gamesRepository.findOne.mockResolvedValue(game);
      gamesRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .patch('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/games/:identifier/:slug (DELETE)', () => {
    it('Authentication: run by User; forbidden; return 403', async () => {
      await request(app.getHttpServer())
        .delete('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can delete game; return 204', async () => {
      gamesRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Admin')
        .expect(204);
    });

    it('Authentication: run by Moderator; can delete game; return 204', async () => {
      gamesRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Moderator')
        .expect(204);
    });

    it('return 404 - NotFoundException, game not found', async () => {
      gamesRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/articles/games/gameId/gameSlug')
        .set('Cookie', 'Moderator')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });
});

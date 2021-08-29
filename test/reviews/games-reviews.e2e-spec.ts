import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import Game from '../../src/articles/games/entities/game.entity';
import { GamesRepository } from '../../src/articles/games/games.repository';
import { UserRole } from '../../src/auth/entities/user-role';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import GamesReview from '../../src/reviews/games-reviews/entities/games-review.entity';
import { GamesReviewsController } from '../../src/reviews/games-reviews/games-reviews.controller';
import { GamesReviewsRepository } from '../../src/reviews/games-reviews/games-reviews.repository';
import { GamesReviewsService } from '../../src/reviews/games-reviews/games-reviews.service';
import User from '../../src/users/entities/user.entity';
import { WallsGamesRepository } from '../../src/walls/walls-games/walls-games.repository';

const mockGamesRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsGamesRepository = () => ({
  checkUserHasStatusesOnGame: jest.fn(),
});

const mockGamesReviewsRepository = () => ({
  create: jest.fn((dto) => {
    const gamesReview = new GamesReview();
    gamesReview.review = dto.review;
    gamesReview.overall = dto.overall;
    gamesReview.art = dto.art;
    gamesReview.characters = dto.characters;
    gamesReview.story = dto.story;
    gamesReview.enjoyment = dto.enjoyment;
    gamesReview.graphics = dto.graphics;
    gamesReview.music = dto.music;
    gamesReview.voicing = dto.voicing;
    gamesReview.game = dto.game;
    gamesReview.user = dto.user;
    return gamesReview;
  }),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForGame: jest.fn(),
  getReviewsForUser: jest.fn(),
});

const mockGameReview = (user?: User, game?: Game) => {
  const review = new GamesReview();
  review.user = user;
  review.game = game;
  review.review = 'Some Review';
  review.overall = 9;
  return review;
};

const mockGame = () => {
  const game = new Game();
  game.title = 'Mock Game';
  return game;
};

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
    if (!cookieUser) {
      throw new UnauthorizedException();
    }

    req.user = mockUser(cookieUser);

    return true;
  }),
};

describe('GamesReviewsController (e2e)', () => {
  let app: INestApplication;
  let gamesRepository;
  let wallsGamesRepository;
  let gamesReviewsRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [GamesReviewsController],
      providers: [
        GamesReviewsService,
        { provide: GamesRepository, useFactory: mockGamesRepository },
        { provide: WallsGamesRepository, useFactory: mockWallsGamesRepository },
        {
          provide: GamesReviewsRepository,
          useFactory: mockGamesReviewsRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    gamesRepository = moduleFixture.get(GamesRepository);
    wallsGamesRepository = moduleFixture.get(WallsGamesRepository);
    gamesReviewsRepository = moduleFixture.get(GamesReviewsRepository);

    await app.init();
  });

  describe('api/gamesreviews/game/:gameIdentifier (POST)', () => {
    it('Authentication: anonymous user cannot create review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: body cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: review cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ overall: 1 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: graphics not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, graphics: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: music not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, music: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: voicing not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, voicing: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); game not found', async () => {
      gamesRepository.findOne.mockResolvedValue(null);
      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); user cannot review game due to not having it on their wallsgame', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.checkUserHasStatusesOnGame.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('Throw ConflictException (409); user cannot review more than once the same game', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.checkUserHasStatusesOnGame.mockResolvedValue(true);
      gamesReviewsRepository.findOne.mockResolvedValue(new GamesReview());

      await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('created review; return review with status 201', async () => {
      gamesRepository.findOne.mockResolvedValue(mockGame());
      wallsGamesRepository.checkUserHasStatusesOnGame.mockResolvedValue(true);
      gamesReviewsRepository.findOne.mockResolvedValue(null);

      const createDto = {
        review: 'Review',
        overall: 5,
        art: 1,
        characters: 2,
        story: 3,
        enjoyment: 9,
        graphics: 2,
        music: 2,
        voicing: 3,
      };

      const result = await request(app.getHttpServer())
        .post('/api/gamesreviews/game/gameIdentifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        user: mockUser('User'),
        game: mockGame(),
        ...createDto,
      });
    });
  });

  describe('/api/gamesreviews/game/:gameIdentifier (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/gamesreviews/game/gameIdentifier')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/gamesreviews/game/gameIdentifier?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/gamesreviews/game/gameIdentifier?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockGameReview(mockUser('User'), mockGame());

      gamesReviewsRepository.reviewsCount.mockResolvedValue(1);
      gamesReviewsRepository.getReviewsForGame.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/gamesreviews/game/gameIdentifier?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [review],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      const review = mockGameReview(mockUser('User'), mockGame());

      gamesReviewsRepository.reviewsCount.mockResolvedValue(3);
      gamesReviewsRepository.getReviewsForGame.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/gamesreviews/game/gameIdentifier?page=2&limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [review],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(result.body.nextPage).toMatch(/page=3/);
      expect(result.body.nextPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/gameIdentifier/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/gameIdentifier/);
    });
  });

  describe('/api/gamesreviews/user/:username (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/gamesreviews/user/username')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/gamesreviews/user/username?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/gamesreviews/user/username?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockGameReview(mockUser('User'), mockGame());

      gamesReviewsRepository.reviewsCount.mockResolvedValue(1);
      gamesReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/gamesreviews/user/username?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [review],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      const review = mockGameReview(mockUser('User'), mockGame());

      gamesReviewsRepository.reviewsCount.mockResolvedValue(3);
      gamesReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/gamesreviews/user/username?page=2&limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [review],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(result.body.nextPage).toMatch(/page=3/);
      expect(result.body.nextPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/username/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/username/);
    });
  });

  describe('/api/gamesreviews/:identifier (PATCH)', () => {
    it('Authentication: anonymous user cannot update review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .send({ overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .send({ art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .send({ characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .send({ story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .send({ enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); review not found', async () => {
      gamesReviewsRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('updated review; return review with status 200', async () => {
      const review = mockGameReview(mockUser('User'), mockGame());
      gamesReviewsRepository.findOne.mockResolvedValue(review);
      gamesReviewsRepository.save.mockImplementationOnce((obj) => obj);

      const updateDto = {
        review: 'new Review',
        overall: 1,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        user: mockUser('User'),
        game: mockGame(),
        ...updateDto,
      });
    });
  });

  describe('/api/gamesreviews/:identifier (DELETE)', () => {
    it('Authentication: anonymous user cannot delete review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/gamesreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404), review not found', async () => {
      gamesReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('delete review and return status 204', async () => {
      gamesReviewsRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/gamesreviews/identifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ComicsRepository } from '../../src/articles/comics/comics.repository';
import Comic from '../../src/articles/comics/entities/comic.entity';
import { UserRole } from '../../src/auth/entities/user-role';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { ComicsReviewsController } from '../../src/reviews/comics-reviews/comics-reviews.controller';
import { ComicsReviewsRepository } from '../../src/reviews/comics-reviews/comics-reviews.repository';
import { ComicsReviewsService } from '../../src/reviews/comics-reviews/comics-reviews.service';
import ComicsReview from '../../src/reviews/comics-reviews/entities/comics-review.entity';
import User from '../../src/users/entities/user.entity';
import { WallsComicsRepository } from '../../src/walls/walls-comics/walls-comics.repository';

const mockComicsRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsComicsRepository = () => ({
  checkUserHasStatusesOnComic: jest.fn(),
});

const mockComicsReviewsRepository = () => ({
  create: jest.fn((dto) => {
    const comicsReview = new ComicsReview();
    comicsReview.review = dto.review;
    comicsReview.overall = dto.overall;
    comicsReview.art = dto.art;
    comicsReview.characters = dto.characters;
    comicsReview.story = dto.story;
    comicsReview.enjoyment = dto.enjoyment;
    comicsReview.comic = dto.comic;
    comicsReview.user = dto.user;
    return comicsReview;
  }),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForComic: jest.fn(),
  getReviewsForUser: jest.fn(),
});

const mockComicReview = (user?: User, comic?: Comic) => {
  const review = new ComicsReview();
  review.user = user;
  review.comic = comic;
  review.review = 'Some Review';
  review.overall = 9;
  return review;
};

const mockComic = () => {
  const comic = new Comic();
  comic.title = 'Mock comic';
  return comic;
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

describe('ComicsReviewsController (e2e)', () => {
  let app: INestApplication;
  let comicsRepository;
  let wallsComicsRepository;
  let comicsReviewsRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [ComicsReviewsController],
      providers: [
        ComicsReviewsService,
        { provide: ComicsRepository, useFactory: mockComicsRepository },
        {
          provide: WallsComicsRepository,
          useFactory: mockWallsComicsRepository,
        },
        {
          provide: ComicsReviewsRepository,
          useFactory: mockComicsReviewsRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    comicsRepository = moduleFixture.get(ComicsRepository);
    wallsComicsRepository = moduleFixture.get(WallsComicsRepository);
    comicsReviewsRepository = moduleFixture.get(ComicsReviewsRepository);

    await app.init();
  });

  describe('/api/comicsreviews/comic/:comicIdentifier (POST)', () => {
    it('Authentication: anonymous user cannot create review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: body cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: review cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ overall: 1 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); comic not found', async () => {
      comicsRepository.findOne.mockResolvedValue(null);
      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); user cannot review comic due to not having it on their wallscomic', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.checkUserHasStatusesOnComic.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('Throw ConflictException (409); user cannot review more than once the same comic', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.checkUserHasStatusesOnComic.mockResolvedValue(true);
      comicsReviewsRepository.findOne.mockResolvedValue(new ComicsReview());

      await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('created review; return review with status 201', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.checkUserHasStatusesOnComic.mockResolvedValue(true);
      comicsReviewsRepository.findOne.mockResolvedValue(null);

      const createDto = {
        review: 'Review',
        overall: 5,
        art: 1,
        characters: 2,
        story: 3,
        enjoyment: 9,
      };

      const result = await request(app.getHttpServer())
        .post('/api/comicsreviews/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        user: mockUser('User'),
        comic: mockComic(),
        ...createDto,
      });
    });
  });

  describe('/api/comicsreviews/comic/:comicIdentifier (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/comicsreviews/comic/comicIdentifier')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/comicsreviews/comic/comicIdentifier?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/comicsreviews/comic/comicIdentifier?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockComicReview(mockUser('User'), mockComic());

      comicsReviewsRepository.reviewsCount.mockResolvedValue(1);
      comicsReviewsRepository.getReviewsForComic.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/comicsreviews/comic/comicIdentifier?page=1&limit=5')
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
      const review = mockComicReview(mockUser('User'), mockComic());

      comicsReviewsRepository.reviewsCount.mockResolvedValue(3);
      comicsReviewsRepository.getReviewsForComic.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/comicsreviews/comic/comicIdentifier?page=2&limit=1')
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
      expect(result.body.nextPage).toMatch(/comicIdentifier/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/comicIdentifier/);
    });
  });

  describe('/api/comicsreviews/user/:username (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/comicsreviews/user/username')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/comicsreviews/user/username?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/comicsreviews/user/username?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockComicReview(mockUser('User'), mockComic());

      comicsReviewsRepository.reviewsCount.mockResolvedValue(1);
      comicsReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/comicsreviews/user/username?page=1&limit=5')
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
      const review = mockComicReview(mockUser('User'), mockComic());

      comicsReviewsRepository.reviewsCount.mockResolvedValue(3);
      comicsReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/comicsreviews/user/username?page=2&limit=1')
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

  describe('/api/comicsreviews/:identifier (PATCH)', () => {
    it('Authentication: anonymous user cannot update review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .send({ overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .send({ art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .send({ characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .send({ story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .send({ enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); review not found', async () => {
      comicsReviewsRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('updated review; return review with status 200', async () => {
      const review = mockComicReview(mockUser('User'), mockComic());
      comicsReviewsRepository.findOne.mockResolvedValue(review);
      comicsReviewsRepository.save.mockImplementationOnce((obj) => obj);

      const updateDto = {
        review: 'new Review',
        overall: 1,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        user: mockUser('User'),
        comic: mockComic(),
        ...updateDto,
      });
    });
  });

  describe('/api/comicsreviews/:identifier (DELETE)', () => {
    it('Authentication: anonymous user cannot delete review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/comicsreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404), review not found', async () => {
      comicsReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('delete review and return status 204', async () => {
      comicsReviewsRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/comicsreviews/identifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

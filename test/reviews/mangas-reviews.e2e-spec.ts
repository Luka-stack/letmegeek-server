import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import Manga from '../../src/articles/mangas/entities/manga.entity';
import { MangasRepository } from '../../src/articles/mangas/mangas.repository';
import { UserRole } from '../../src/auth/entities/user-role';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import MangasReview from '../../src/reviews/mangas-reviews/entities/mangas-review.entity';
import { MangasReviewsController } from '../../src/reviews/mangas-reviews/mangas-reviews.controller';
import { MangasReviewsRepository } from '../../src/reviews/mangas-reviews/mangas-reviews.repository';
import { MangasReviewsService } from '../../src/reviews/mangas-reviews/mangas-reviews.service';
import User from '../../src/users/entities/user.entity';
import { WallsMangasRepository } from '../../src/walls/walls-mangas/walls-mangas.repository';

const mockMangasRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsMangasRepository = () => ({
  checkUserHasStatusesOnManga: jest.fn(),
});

const mockMangasReviewsRepository = () => ({
  create: jest.fn((dto) => {
    const mangasReview = new MangasReview();
    mangasReview.review = dto.review;
    mangasReview.overall = dto.overall;
    mangasReview.art = dto.art;
    mangasReview.characters = dto.characters;
    mangasReview.story = dto.story;
    mangasReview.enjoyment = dto.enjoyment;
    mangasReview.manga = dto.manga;
    mangasReview.user = dto.user;
    return mangasReview;
  }),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForManga: jest.fn(),
  getReviewsForUser: jest.fn(),
});

const mockMangaReview = (user?: User, manga?: Manga) => {
  const review = new MangasReview();
  review.user = user;
  review.manga = manga;
  review.review = 'Some Review';
  review.overall = 9;
  return review;
};

const mockManga = () => {
  const manga = new Manga();
  manga.title = 'Mock Manga';
  return manga;
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

describe('MangasReviewsController (e2e)', () => {
  let app: INestApplication;
  let mangasRepository;
  let wallsMangasRepository;
  let mangasReviewsRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [MangasReviewsController],
      providers: [
        MangasReviewsService,
        { provide: MangasRepository, useFactory: mockMangasRepository },
        {
          provide: WallsMangasRepository,
          useFactory: mockWallsMangasRepository,
        },
        {
          provide: MangasReviewsRepository,
          useFactory: mockMangasReviewsRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    mangasRepository = moduleFixture.get(MangasRepository);
    wallsMangasRepository = moduleFixture.get(WallsMangasRepository);
    mangasReviewsRepository = moduleFixture.get(MangasReviewsRepository);

    await app.init();
  });

  describe('/api/mangasreviews/manga/:mangaIdentifier (POST)', () => {
    it('Authentication: anonymous user cannot create review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: body cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: review cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ overall: 1 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); manga not found', async () => {
      mangasRepository.findOne.mockResolvedValue(null);
      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); user cannot review manga due to not having it on their wallsmanga', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.checkUserHasStatusesOnManga.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('Throw ConflictException (409); user cannot review more than once the same manga', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.checkUserHasStatusesOnManga.mockResolvedValue(true);
      mangasReviewsRepository.findOne.mockResolvedValue(new MangasReview());

      await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('created review; return review with status 201', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.checkUserHasStatusesOnManga.mockResolvedValue(true);
      mangasReviewsRepository.findOne.mockResolvedValue(null);

      const createDto = {
        review: 'Review',
        overall: 5,
        art: 1,
        characters: 2,
        story: 3,
        enjoyment: 9,
      };

      const result = await request(app.getHttpServer())
        .post('/api/mangasreviews/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        user: mockUser('User'),
        manga: mockManga(),
        ...createDto,
      });
    });
  });

  describe('/api/mangasreviews/manga/:mangaIdentifier (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/mangasreviews/manga/mangaIdentifier')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/mangasreviews/manga/mangaIdentifier?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/mangasreviews/manga/mangaIdentifier?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockMangaReview(mockUser('User'), mockManga());

      mangasReviewsRepository.reviewsCount.mockResolvedValue(1);
      mangasReviewsRepository.getReviewsForManga.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/mangasreviews/manga/mangaIdentifier?page=1&limit=5')
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
      const review = mockMangaReview(mockUser('User'), mockManga());

      mangasReviewsRepository.reviewsCount.mockResolvedValue(3);
      mangasReviewsRepository.getReviewsForManga.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/mangasreviews/manga/mangaIdentifier?page=2&limit=1')
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
      expect(result.body.nextPage).toMatch(/mangaIdentifier/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/mangaIdentifier/);
    });
  });

  describe('/api/mangasreviews/user/:username (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/mangasreviews/user/username')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/mangasreviews/user/username?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/mangasreviews/user/username?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockMangaReview(mockUser('User'), mockManga());

      mangasReviewsRepository.reviewsCount.mockResolvedValue(1);
      mangasReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/mangasreviews/user/username?page=1&limit=5')
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
      const review = mockMangaReview(mockUser('User'), mockManga());

      mangasReviewsRepository.reviewsCount.mockResolvedValue(3);
      mangasReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/mangasreviews/user/username?page=2&limit=1')
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

  describe('/api/mangasreviews/:identifier (PATCH)', () => {
    it('Authentication: anonymous user cannot update review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .send({ overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .send({ art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .send({ characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .send({ story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .send({ enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); review not found', async () => {
      mangasReviewsRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('updated review; return review with status 200', async () => {
      const review = mockMangaReview(mockUser('User'), mockManga());
      mangasReviewsRepository.findOne.mockResolvedValue(review);
      mangasReviewsRepository.save.mockImplementationOnce((obj) => obj);

      const updateDto = {
        review: 'new Review',
        overall: 1,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        user: mockUser('User'),
        manga: mockManga(),
        ...updateDto,
      });
    });
  });

  describe('/api/mangasreviews/:identifier (DELETE)', () => {
    it('Authentication: anonymous user cannot delete review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/mangasreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404), review not found', async () => {
      mangasReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('delete review and return status 204', async () => {
      mangasReviewsRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/mangasreviews/identifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

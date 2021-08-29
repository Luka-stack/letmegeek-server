import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';

import { ComicsRepository } from '../../src/articles/comics/comics.repository';
import Comic from '../../src/articles/comics/entities/comic.entity';
import { UserRole } from '../../src/auth/entities/user-role';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import User from '../../src/users/entities/user.entity';
import WallsComic from '../../src/walls/walls-comics/entities/walls-comic.entity';
import { WallsComicsController } from '../../src/walls/walls-comics/walls-comics.controller';
import { WallsComicsRepository } from '../../src/walls/walls-comics/walls-comics.repository';
import { WallsComicsService } from '../../src/walls/walls-comics/walls-comics.service';
import { WallArticleStatus } from '../../src/walls/entities/wall-article-status';

const mockComicsRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsComicsRepository = () => ({
  create: jest.fn((dto) => {
    const wallsComic = new WallsComic();
    wallsComic.status = dto.status;
    wallsComic.username = dto.user.username;
    wallsComic.comic = dto.comic;
    wallsComic.issues = dto.issues;
    wallsComic.finishedAt = dto.finishedAt;
    wallsComic.startedAt = dto.startedAt;
    wallsComic.score = dto.score;
    return wallsComic;
  }),
  findUserRecordByComic: jest.fn(),
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

const mockComic = () => {
  const comic = new Comic();
  comic.title = 'Mock Comic';
  return comic;
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

describe('WallsComicsController (e2e)', () => {
  let app: INestApplication;
  let wallsComicsRepository;
  let comicsRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WallsComicsController],
      providers: [
        WallsComicsService,
        {
          provide: WallsComicsRepository,
          useFactory: mockWallsComicsRepository,
        },
        { provide: ComicsRepository, useFactory: mockComicsRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    comicsRepository = moduleFixture.get(ComicsRepository);
    wallsComicsRepository = moduleFixture.get(WallsComicsRepository);

    await app.init();
  });

  describe('/api/wallscomics/comic/:comicIdentifier (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: empty status; wallscomic record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ status: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: score not a number; wallscomic record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallscomic record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({
          status: WallArticleStatus.COMPLETED,
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallscomic record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: issues not a number; wallscomic record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, issues: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created wallscomic record; return 201', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.findOne.mockResolvedValue(null);
      wallsComicsRepository.save.mockResolvedValue({});

      const createDto = {
        status: WallArticleStatus.COMPLETED,
        issues: 123,
        finishedAt: new Date(),
        startedAt: new Date(),
        score: 5,
      };

      const result = await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentiifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        comic: { title: mockComic().title },
        username: mockUser('User').username,
        status: createDto.status,
        issues: createDto.issues,
        finishedAt: createDto.finishedAt.toISOString(),
        startedAt: createDto.startedAt.toISOString(),
        score: createDto.score,
      });
    });

    it('Throw NotFoundException (404); comic not found', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); wallscomic for provided comic already exists', async () => {
      comicsRepository.findOne.mockResolvedValue(mockComic());
      wallsComicsRepository.findOne.mockResolvedValue(new WallsComic());

      await request(app.getHttpServer())
        .post('/api/wallscomics/comic/comicIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/wallscomics/:username (GET)', () => {
    it('Return wallscomic records for given user', async () => {
      const wallsComic = new WallsComic();
      wallsComic.status = WallArticleStatus.DROPPED;
      wallsComic.comic = mockComic();

      wallsComicsRepository.getRecords.mockResolvedValue([wallsComic]);

      const result = await request(app.getHttpServer())
        .get('/api/wallscomics/Tester')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([wallsComic]);
    });
  });

  describe('/api/wallscomics/comic/:comicIdentifier (PATCH)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallscomics/comic/comicIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: score not a number; wallscomic record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallscomic record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallscomic record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: issues not a number; wallscomic record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallscomics/comic/comicIdentifier')
        .set('Cookie', 'User')
        .send({ issues: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated wallscomic record; return 200', async () => {
      const wallsComic = new WallsComic();
      wallsComic.status = WallArticleStatus.IN_PLANS;
      wallsComic.issues = 0;
      wallsComic.score = 0;

      wallsComicsRepository.findUserRecordByComic.mockResolvedValue(wallsComic);
      wallsComicsRepository.save.mockImplementationOnce((wall) => wall);

      const updateDto = {
        status: WallArticleStatus.COMPLETED,
        issues: 100,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/wallscomics/comic/comicIdentiifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.status).toEqual(updateDto.status);
      expect(result.body.issues).toEqual(updateDto.issues);
      expect(result.body.score).toEqual(wallsComic.score);
    });

    it('Throw NotFoundException (404); wallscomic record not found', async () => {
      wallsComicsRepository.findUserRecordByComic.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/wallscomics/comic/comicIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('/api/wallscomics/comic/:comicIdentifier (DELETE)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/wallscomics/comic/comicIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404); wallscomic record not found', async () => {
      wallsComicsRepository.findUserRecordByComic.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/wallscomics/comic/comicIdentiifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw NotFoundException (404); wallscomic record not found', async () => {
      wallsComicsRepository.findUserRecordByComic.mockResolvedValue(
        new WallsComic(),
      );

      await request(app.getHttpServer())
        .delete('/api/wallscomics/comic/comicIdentiifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

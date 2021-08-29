import {
  ExecutionContext,
  UnauthorizedException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import * as request from 'supertest';

import { WallArticleStatus } from '../../src/walls/entities/wall-article-status';
import Manga from '../../src/articles/mangas/entities/manga.entity';
import { MangasRepository } from '../../src/articles/mangas/mangas.repository';
import { UserRole } from '../../src/auth/entities/user-role';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import User from '../../src/users/entities/user.entity';
import WallsManga from '../../src/walls/walls-mangas/entities/walls-manga.entity';
import { WallsMangasController } from '../../src/walls/walls-mangas/walls-mangas.controller';
import { WallsMangasRepository } from '../../src/walls/walls-mangas/walls-mangas.repository';
import { WallsMangasService } from '../../src/walls/walls-mangas/walls-mangas.service';

const mockMangasRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsMangasRepository = () => ({
  create: jest.fn((dto) => {
    const wallsManga = new WallsManga();
    wallsManga.status = dto.status;
    wallsManga.username = dto.user.username;
    wallsManga.manga = dto.manga;
    wallsManga.volumes = dto.volumes;
    wallsManga.chapters = dto.chapters;
    wallsManga.finishedAt = dto.finishedAt;
    wallsManga.startedAt = dto.startedAt;
    wallsManga.score = dto.score;
    return wallsManga;
  }),
  findUserRecordByManga: jest.fn(),
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

const mockManga = () => {
  const manga = new Manga();
  manga.title = 'Mock manga';
  return manga;
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

describe('WallsMangasController (e2e)', () => {
  let app: INestApplication;
  let wallsMangasRepository;
  let mangasRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WallsMangasController],
      providers: [
        WallsMangasService,
        {
          provide: WallsMangasRepository,
          useFactory: mockWallsMangasRepository,
        },
        { provide: MangasRepository, useFactory: mockMangasRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    mangasRepository = moduleFixture.get(MangasRepository);
    wallsMangasRepository = moduleFixture.get(WallsMangasRepository);

    await app.init();
  });

  describe('/api/wallsmangas/manga/:mangaIdentifier (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: empty status; wallsmanga record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ status: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: score not a number; wallsmanga record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallsmanga record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({
          status: WallArticleStatus.COMPLETED,
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallsmanga record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: volumes not a number; wallsmanga record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, volumes: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: chapters not a number; wallsmanga record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, chapters: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created wallsmanga record; return 201', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.findOne.mockResolvedValue(null);
      wallsMangasRepository.save.mockResolvedValue({});

      const createDto = {
        status: WallArticleStatus.COMPLETED,
        volumes: 1,
        chapters: 12,
        finishedAt: new Date(),
        startedAt: new Date(),
        score: 5,
      };

      const result = await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentiifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        manga: { title: mockManga().title },
        username: mockUser('User').username,
        status: createDto.status,
        volumes: createDto.volumes,
        chapters: createDto.chapters,
        finishedAt: createDto.finishedAt.toISOString(),
        startedAt: createDto.startedAt.toISOString(),
        score: createDto.score,
      });
    });

    it('Throw NotFoundException (404); manga not found', async () => {
      mangasRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); wallsmanga for provided manga already exists', async () => {
      mangasRepository.findOne.mockResolvedValue(mockManga());
      wallsMangasRepository.findOne.mockResolvedValue(new WallsManga());

      await request(app.getHttpServer())
        .post('/api/wallsmangas/manga/mangaIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/wallsmangas/:username (GET)', () => {
    it('Return wallsmanga records for given user', async () => {
      const wallsManga = new WallsManga();
      wallsManga.status = WallArticleStatus.DROPPED;
      wallsManga.manga = mockManga();

      wallsMangasRepository.getRecords.mockResolvedValue([wallsManga]);

      const result = await request(app.getHttpServer())
        .get('/api/wallsmangas/Tester')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([wallsManga]);
    });
  });

  describe('/api/wallsmangas/manga/:mangaIdentifier (PATCH)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: score not a number; wallsmanga record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallsmanga record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallsmanga record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: volumes not a number; wallsmanga record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ volumes: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: chapters not a number; wallsmanga record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentifier')
        .set('Cookie', 'User')
        .send({ chapters: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated wallsmanga record; return 200', async () => {
      const wallsManga = new WallsManga();
      wallsManga.status = WallArticleStatus.IN_PLANS;
      wallsManga.volumes = 0;
      wallsManga.chapters = 0;
      wallsManga.score = 0;

      wallsMangasRepository.findUserRecordByManga.mockResolvedValue(wallsManga);
      wallsMangasRepository.save.mockImplementationOnce((wall) => wall);

      const updateDto = {
        status: WallArticleStatus.COMPLETED,
        volumes: 2,
        chapters: 4,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentiifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.status).toEqual(updateDto.status);
      expect(result.body.volumes).toEqual(updateDto.volumes);
      expect(result.body.chapters).toEqual(updateDto.chapters);
      expect(result.body.score).toEqual(wallsManga.score);
    });

    it('Throw NotFoundException (404); wallsmanga record not found', async () => {
      wallsMangasRepository.findUserRecordByManga.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/wallsmangas/manga/mangaIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('/api/wallsmangas/manga/:mangaIdentifier (DELETE)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/wallsmangas/manga/mangaIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404); wallsmanga record not found', async () => {
      wallsMangasRepository.findUserRecordByManga.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/wallsmangas/manga/mangaIdentiifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw NotFoundException (404); wallsmanga record not found', async () => {
      wallsMangasRepository.findUserRecordByManga.mockResolvedValue(
        new WallsManga(),
      );

      await request(app.getHttpServer())
        .delete('/api/wallsmangas/manga/mangaIdentiifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

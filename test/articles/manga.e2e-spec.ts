import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import User from '../../src/users/entities/user.entity';
import Manga from '../../src/articles/mangas/entities/manga.entity';
import { UserRole } from '../../src/auth/entities/user-role';
import { MangaType } from '../../src/articles/mangas/entities/manga-type';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../../src/auth/guards/jwt.strategy';
import { MangasController } from '../../src/articles/mangas/mangas.controller';
import { MangasRepository } from '../../src/articles/mangas/mangas.repository';
import { MangasService } from '../../src/articles/mangas/mangas.service';

const mockMangasRepository = () => ({
  create: jest.fn((dto) => {
    const manga = new Manga();
    manga.draft = dto.draft;
    manga.title = dto.title;
    return manga;
  }),
  save: jest.fn(),
  getFilterCount: jest.fn(),
  getMangas: jest.fn(),
  getManga: jest.fn(),
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

describe('MangasController (e2e)', () => {
  let app: INestApplication;
  let mangasRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [MangasController],
      providers: [
        MangasService,
        { provide: MangasRepository, useFactory: mockMangasRepository },
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

    mangasRepository = moduleFixture.get(MangasRepository);

    await app.init();
  });

  describe('/api/articles/mangas (POST)', () => {
    it('Body Validation: empty body; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty title; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .send({ draft: false })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty draft; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .send({ title: 'Test' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: draft not a boolean; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .send({ title: 'Test', draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ draft: true, title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, description: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: volumes not a number; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, volumes: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: chapters not a string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, chapters: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finished not a date string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, finished: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: type not a MangaType; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, type: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt create manga; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created manga only with title and draft in body; return 201', async () => {
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Body Validation: created manga with all data passed; return 201', async () => {
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .set('Cookie', 'User')
        .send({
          title: 'Test',
          draft: true,
          series: 'Series',
          volumes: 20,
          chapters: 25,
          type: MangaType.LIGHT_NOVEL,
          description: 'Desc',
          genres: '1, 2, 3',
          authors: '11, 22, 33',
          publishers: '111, 222, 333',
          premiered: '2008-09-22',
          finished: '2018-09-22',
        })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Authentication: run by User; create draft manga; return 201', async () => {
      mangasRepository.save.mockResolvedValue({});
      const user = mockUser('User');

      const result = await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .set('Cookie', 'User')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(true);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(false);
    });

    it('Authentication: run by Admin; create draft manga; return 201', async () => {
      mangasRepository.save.mockResolvedValue({});
      const user = mockUser('Admin');

      const result = await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .set('Cookie', 'Admin')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('Authentication: run by Moderator; create draft manga; return 201', async () => {
      mangasRepository.save.mockResolvedValue({});
      const user = mockUser('Moderator');

      const result = await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .post('/api/articles/mangas')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/mangas (GET)', () => {
    const manga = {
      manga_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      manga_slug: 'title_test',
      manga_identifier: '80Vni9G',
      manga_title: 'Title Test',
      manga_draft: false,
      manga_volumes: '55',
      manga_type: MangaType.MANGA,
      manga_imageUrl: 'image Path',
      mangaStats_avgScore: '5',
      mangaStats_countScore: '5',
      mangaStats_members: '5',
    };

    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/mangas')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/mangas?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/mangas?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: premiered not a 4 digit long number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/mangas?page=1&limit=5&premiered=12')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: volumes not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/mangas?page=1&limit=5&volumes=asdasd')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: finished not a boolean; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/mangas?page=1&limit=5&finished=123')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: orderBy not an article name; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/mangas?page=1&limit=5&orderBy=123')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      mangasRepository.getFilterCount.mockResolvedValue(1);
      mangasRepository.getMangas.mockResolvedValue([manga]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/articles/mangas?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [manga],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      mangasRepository.getFilterCount.mockResolvedValue(3);
      mangasRepository.getMangas.mockResolvedValue([manga]);

      const result = await request(app.getHttpServer())
        .get(
          '/api/articles/mangas?page=2&limit=1&orderBy=avgScore&ordering=ASC&name=test123',
        )
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [manga],
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

  describe('/api/articles/mangas/:identifier/:slug (GET)', () => {
    const manga = {
      manga_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      manga_slug: 'title_test',
      manga_identifier: '80Vni9G',
      manga_title: 'Title Test',
      manga_draft: false,
      manga_volumes: '55',
      manga_type: MangaType.MANGA,
      manga_imageUrl: 'image Path',
      mangaStats_avgScore: '5',
      mangaStats_countScore: '5',
      mangaStats_members: '5',
    };

    it('return 404 - NotFoundException, manga not found', async () => {
      mangasRepository.getManga.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/articles/mangas/mangaId/mangaSlug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 200 - return manga', async () => {
      mangasRepository.getManga.mockResolvedValue(manga);

      const result = await request(app.getHttpServer())
        .get('/api/articles/mangas/mangaId/mangaSlug')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual(manga);
    });
  });

  describe('/api/articles/mangas/:identifier/:slug (PATCH)', () => {
    const manga = new Manga();
    manga.title = 'Old Title';
    manga.draft = false;

    it('Authentication: run by User; forbidden; return 403', async () => {
      mangasRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can update manga; return 200', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Authentication: run by Moderator; can update manga; return 200', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Moderator')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Body Validation: draft not a boolean; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ description: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: volumes not a number; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ volumes: 'asdasd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: chapters not a number; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ chapters: 'asdasd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finished not a date; didnt update manga; return 400', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .send({ finished: 'asdasd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated manga with all data passed; return 201', async () => {
      mangasRepository.findOne.mockImplementationOnce(() => {
        const manga = new Manga();
        manga.title = 'TT';
        manga.draft = false;
        manga.volumes = 1;
        manga.chapters = 1;
        manga.finished = new Date();
        manga.description = 'TT';
        manga.genres = 'TT';
        manga.authors = 'TT';
        manga.publishers = 'TT';
        manga.premiered = new Date();
        return manga;
      });
      mangasRepository.save.mockResolvedValue({});

      const updated = {
        title: 'Test',
        draft: true,
        volumes: 1,
        chapters: 1,
        description: 'Desc',
        genres: '1, 2, 3',
        authors: '11, 22, 33',
        publishers: '111, 222, 333',
        premiered: '2008-09-22',
        finished: '2018-09-22',
      };

      const result = await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
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

    it('return 404 - NotFoundException, manga not found', async () => {
      mangasRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      mangasRepository.findOne.mockResolvedValue(manga);
      mangasRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .patch('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/mangas/:identifier/:slug (DELETE)', () => {
    it('Authentication: run by User; forbidden; return 403', async () => {
      await request(app.getHttpServer())
        .delete('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can delete manga; return 204', async () => {
      mangasRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Admin')
        .expect(204);
    });

    it('Authentication: run by Moderator; can delete manga; return 204', async () => {
      mangasRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Moderator')
        .expect(204);
    });

    it('return 404 - NotFoundException, manga not found', async () => {
      mangasRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/articles/mangas/mangaId/mangaSlug')
        .set('Cookie', 'Moderator')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });
});

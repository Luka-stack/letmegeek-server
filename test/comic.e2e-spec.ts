import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import User from '../src/users/entities/user.entity';
import Comic from '../src/articles/comics/entities/comic.entity';
import { UserRole } from '../src/auth/entities/user-role';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/guards/jwt.strategy';
import { ComicsController } from '../src/articles/comics/comics.controller';
import { ComicsRepository } from '../src/articles/comics/comics.repository';
import { ComicsService } from '../src/articles/comics/comics.service';

const mockComicsRepository = () => ({
  create: jest.fn((dto) => {
    const comic = new Comic();
    comic.draft = dto.draft;
    comic.title = dto.title;
    return comic;
  }),
  save: jest.fn(),
  getFilterCount: jest.fn(),
  getComics: jest.fn(),
  getComic: jest.fn(),
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

describe('ComicsController (e2e)', () => {
  let app: INestApplication;
  let comicsRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [ComicsController],
      providers: [
        ComicsService,
        { provide: ComicsRepository, useFactory: mockComicsRepository },
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

    comicsRepository = moduleFixture.get(ComicsRepository);

    await app.init();
  });

  describe('/api/articles/comics (POST)', () => {
    it('Body Validation: empty body; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty title; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        .send({ draft: false })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty draft; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: draft not a boolean; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ draft: true, title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: issues not a number; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, issues: 'edsedw' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finished not a date string; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, finished: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, description: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt create comic; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created comic only with title and draft in body; return 201', async () => {
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/comics')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Body Validation: created comic with all data passed; return 201', async () => {
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/comics')
        .set('Cookie', 'User')
        .send({
          title: 'Test',
          draft: true,
          finished: '2008-09-22',
          issues: 20,
          description: 'Desc',
          genres: '1, 2, 3',
          authors: '11, 22, 33',
          publishers: '111, 222, 333',
          premiered: '2008-09-22',
        })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Authentication: run by User; create draft comic; return 201', async () => {
      comicsRepository.save.mockResolvedValue({});
      const user = mockUser('User');

      const result = await request(app.getHttpServer())
        .post('/api/articles/comics')
        .set('Cookie', 'User')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(true);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(false);
    });

    it('Authentication: run by Admin; create draft comic; return 201', async () => {
      comicsRepository.save.mockResolvedValue({});
      const user = mockUser('Admin');

      const result = await request(app.getHttpServer())
        .post('/api/articles/comics')
        .set('Cookie', 'Admin')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('Authentication: run by Moderator; create draft comic; return 201', async () => {
      comicsRepository.save.mockResolvedValue({});
      const user = mockUser('Moderator');

      const result = await request(app.getHttpServer())
        .post('/api/articles/comics')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .post('/api/articles/comics')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/comics (GET)', () => {
    const comic = {
      comic_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      comic_slug: 'title_test',
      comic_identifier: '80Vni9G',
      comic_title: 'Title Test',
      comic_draft: false,
      comic_imageUrl: 'image Path',
      comicStats_avgScore: '5',
      comicStats_countScore: '5',
      comicStats_members: '5',
    };

    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/comics')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/comics?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/comics?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: premiered not a 4 digit long number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/comics?page=1&limit=5&premiered=12')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: orderBy not an article name; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/comics?page=1&limit=5&orderBy=123')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      comicsRepository.getFilterCount.mockResolvedValue(1);
      comicsRepository.getComics.mockResolvedValue([comic]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/articles/comics?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [comic],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      comicsRepository.getFilterCount.mockResolvedValue(3);
      comicsRepository.getComics.mockResolvedValue([comic]);

      const result = await request(app.getHttpServer())
        .get(
          '/api/articles/comics?page=2&limit=1&orderBy=avgScore&ordering=ASC&name=test123',
        )
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [comic],
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

  describe('/api/articles/comics/:identifier/:slug (GET)', () => {
    const comic = {
      comic_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      comic_slug: 'title_test',
      comic_identifier: '80Vni9G',
      comic_title: 'Title Test',
      comic_draft: false,
      comic_imageUrl: 'image Path',
      comicStats_avgScore: '5',
      comicStats_countScore: '5',
      comicStats_members: '5',
    };

    it('return 404 - NotFoundException, comic not found', async () => {
      comicsRepository.getComic.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/articles/comics/comicId/comicSlug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 200 - return comic', async () => {
      comicsRepository.getComic.mockResolvedValue(comic);

      const result = await request(app.getHttpServer())
        .get('/api/articles/comics/comicId/comicSlug')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual(comic);
    });
  });

  describe('/api/articles/comics/:identifier/:slug (PATCH)', () => {
    const comic = new Comic();
    comic.title = 'Old Title';
    comic.draft = false;

    it('Authentication: run by User; forbidden; return 403', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can update comic; return 200', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Authentication: run by Moderator; can update comic; return 200', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Moderator')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Body Validation: draft not a boolean; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finished not a date; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ finished: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: issues not a number; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ issues: 'qwe' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ description: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt update comic; return 400', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .send({ premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated comic with all data passed; return 201', async () => {
      comicsRepository.findOne.mockImplementationOnce(() => {
        const comic = new Comic();
        comic.title = 'TT';
        comic.draft = false;
        comic.finished = new Date();
        comic.issues = 1;
        comic.description = 'TT';
        comic.genres = 'TT';
        comic.authors = 'TT';
        comic.publishers = 'TT';
        comic.premiered = new Date();
        return comic;
      });
      comicsRepository.save.mockResolvedValue({});

      const updated = {
        title: 'Test',
        draft: true,
        issues: 20,
        finished: '2018-09-22',
        description: 'Desc',
        genres: '1, 2, 3',
        authors: '11, 22, 33',
        publishers: '111, 222, 333',
        premiered: '2008-09-22',
      };

      const result = await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
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

    it('return 404 - NotFoundException, comic not found', async () => {
      comicsRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      comicsRepository.findOne.mockResolvedValue(comic);
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .patch('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/comics/:identifier/:slug (DELETE)', () => {
    it('Authentication: run by User; forbidden; return 403', async () => {
      await request(app.getHttpServer())
        .delete('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can delete comic; return 204', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Admin')
        .expect(204);
    });

    it('Authentication: run by Moderator; can delete comic; return 204', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Moderator')
        .expect(204);
    });

    it('return 404 - NotFoundException, comic not found', async () => {
      comicsRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/articles/comics/comicId/comicSlug')
        .set('Cookie', 'Moderator')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });
});

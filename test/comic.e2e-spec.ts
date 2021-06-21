import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import Comic from '../src/comics/entities/comic.entity';
import { ComicsService } from '../src/comics/comics.service';
import { ComicsController } from '../src/comics/comics.controller';
import { ComicsRepository } from '../src/comics/comics.repository';
import { makeId, slugify } from '../src/utils/helpers';

const mockComicsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  getComics: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('ComicsController (e2e)', () => {
  let app: INestApplication;
  let comicsRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ComicsController],
      providers: [
        ComicsService,
        { provide: ComicsRepository, useFactory: mockComicsRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    comicsRepository = moduleFixture.get(ComicsRepository);
    await app.init();
  });

  describe('/api/comics (POST)', () => {
    it('return 400, didnt create comic cuz title was empty', async () => {
      // when then
      const comicDto = {
        draft: false,
      };

      await request(app.getHttpServer())
        .post('/api/comics')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 400, didnt create comic cuz draft was empty', async () => {
      // when then
      const comicDto = {
        title: 'SomeTitle',
      };

      await request(app.getHttpServer())
        .post('/api/comics')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('returns created Comic and status 201', async () => {
      // given
      comicsRepository.create.mockImplementation((dto) => {
        return {
          id: 'someId',
          identifier: makeId(2),
          slug: slugify(dto.title),
          updatedAt: new Date(),
          createdAt: new Date(),
          ...dto,
        };
      });
      comicsRepository.save.mockResolvedValue({});

      const comicDto = {
        title: 'New Title',
        draft: false,
        issues: 24,
        finished: new Date().toISOString(),
        premiered: new Date().toISOString(),
      };

      // when, then
      const response = await request(app.getHttpServer())
        .post('/api/comics')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(comicDto.title),
        title: comicDto.title,
        issues: comicDto.issues,
        draft: comicDto.draft,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        finished: comicDto.premiered,
        premiered: comicDto.premiered,
      });
    });

    it('returns status 409, didnt create Comic due to the title not being unique', async () => {
      // given
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when then
      const comicDto = {
        title: 'New Title',
        draft: false,
        issues: 24,
      };

      await request(app.getHttpServer())
        .post('/api/comics')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/comics (GET)', () => {
    it('reutrns 400, filters issues not a number', async () => {
      // when then
      await request(app.getHttpServer())
        .get('/api/comics?issues=adasd')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('reutrns 400, filters finished not a boolean', async () => {
      // when then
      await request(app.getHttpServer())
        .get('/api/comics?finished=123')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('reutrns 400, filters premiered not a year', async () => {
      // when then
      await request(app.getHttpServer())
        .get('/api/comics?premiered=23')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('returns 200 and a list of comics', async () => {
      // given
      comicsRepository.getComics.mockResolvedValue([new Comic()]);

      // when then
      const response = await request(app.getHttpServer())
        .get('/api/comics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('/api/comics/:identifier (PATCH)', () => {
    it('returns status 404', async () => {
      // given
      comicsRepository.findOne.mockResolvedValue(null);

      // when then
      await request(app.getHttpServer())
        .patch('/api/comics/identifier/slug')
        .send({})
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated comic and status 200', async () => {
      // given
      const mockComic = new Comic();
      mockComic.title = 'Old Title';
      mockComic.issues = 24;

      comicsRepository.findOne.mockResolvedValue(mockComic);
      comicsRepository.save.mockResolvedValue({});

      // when
      const comicDto = {
        title: 'Updated One',
        issues: 999,
      };
      const response = await request(app.getHttpServer())
        .patch('/api/comics/identifier/slug')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.title).toEqual(comicDto.title);
      expect(response.body.issues).toEqual(comicDto.issues);
    });

    it('updates draft to true, returns 200 and updated comic with updated timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockComic = new Comic();
      mockComic.title = 'Old Title';
      mockComic.issues = 24;
      mockComic.createdAt = date;

      comicsRepository.findOne.mockResolvedValue(mockComic);
      comicsRepository.save.mockResolvedValue({});

      // when
      const comicDto = {
        draft: true,
      };
      const response = await request(app.getHttpServer())
        .patch('/api/comics/identifier/slug')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.createdAt).not.toEqual(date);
    });

    it('draft stays the same, returns 200 and updated comic with old timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockComic = new Comic();
      mockComic.title = 'Old Title';
      mockComic.issues = 24;
      mockComic.createdAt = date;

      comicsRepository.findOne.mockResolvedValue(mockComic);
      comicsRepository.save.mockResolvedValue({});

      // when then
      const comicDto = {
        issues: 8008,
      };
      const response = await request(app.getHttpServer())
        .patch('/api/comics/identifier/slug')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.createdAt).toEqual(date.toISOString());
    });

    it('returns status 409, didnt create comic due to the title not being unique', async () => {
      // given
      comicsRepository.findOne.mockResolvedValue(new Comic());
      comicsRepository.save.mockRejectedValue({ code: 23505 });

      // when then
      await request(app.getHttpServer())
        .patch('/api/comics/identifier/slug')
        .send({})
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/comics/:identifier (DELETE)', () => {
    it('returns status 404', async () => {
      // given
      comicsRepository.delete.mockResolvedValue({ affected: 0 });

      // when, then
      await request(app.getHttpServer())
        .delete('/api/comics/identifier/slug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns status 204', async () => {
      // given
      comicsRepository.delete.mockResolvedValue({ affected: 1 });

      // when, then
      await request(app.getHttpServer())
        .delete('/api/comics/identifier/slug')
        .expect(204);
    });
  });

  describe('DTO validation test', () => {
    it('return 400, provided draft as a string', async () => {
      const comicDto = {
        title: 'title',
        draft: 'false',
      };

      await request(app.getHttpServer())
        .post('/api/comics')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 400, provided genres not as a comma separated strings', async () => {
      const comicDto = {
        title: 'title23',
        draft: false,
        genres: 'qwe) qwe) qwe',
      };

      await request(app.getHttpServer())
        .post('/api/comics')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 400, provided finished not as a date', async () => {
      const comicDto = {
        title: 'title23',
        draft: false,
        finished: 'asdasd',
      };

      await request(app.getHttpServer())
        .post('/api/comics')
        .send(comicDto)
        .expect('Content-Type', /json/)
        .expect(400);
    });
  });
});

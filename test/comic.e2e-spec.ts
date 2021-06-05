import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { ComicsModule } from '../src/comics/comics.module';
import { ComicsRepository } from '../src/comics/comics.repository';

const mockComicsRepository = {
  createComic: jest.fn((dto) => ({
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'test-slug',
    identifier: '80Vni9G',
    ...dto,
  })),
  save: jest.fn((book) => book),
  find: jest.fn(() => {
    return [mockComic];
  }),
  findOne: jest.fn((payload) => {
    return payload.identifier === 'notfound' ? null : mockComic;
  }),
  delete: jest.fn((payload) => {
    return payload.identifier === 'notfound'
      ? { affected: 0 }
      : { affected: 1 };
  }),
};

const mockComic = {
  title: 'Title',
  author: 'Author',
  publisher: 'Publisher',
  premiered: new Date().toString(),
  draft: false,
};

describe('ComicsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ComicsModule, TypeOrmModule.forFeature([ComicsRepository])],
    })
      .overrideProvider(ComicsRepository)
      .useValue(mockComicsRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/api/comics (POST)', () => {
    it('returns created Comic and status 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/comics')
        .send(mockComic)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: expect.any(String),
        ...mockComic,
      });
    });
  });

  describe('/api/comics (GET)', () => {
    it('return list of comics and status 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/comics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([mockComic]);
    });
  });

  describe('/api/comics/:identifier (PATCH)', () => {
    it('returns status 404', async () => {
      await request(app.getHttpServer())
        .patch('/api/comics/notfound')
        .send(mockComic)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated book and status 200', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/comics/123')
        .send(mockComic)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockComic);
    });
  });

  describe('/api/comics/:identifier (DELETE)', () => {
    it('returns status 404', async () => {
      await request(app.getHttpServer())
        .delete('/api/comics/notfound')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns status 204', async () => {
      await request(app.getHttpServer()).delete('/api/comics/123').expect(204);
    });
  });
});

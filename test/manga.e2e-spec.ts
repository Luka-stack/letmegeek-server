import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';

import { MangasModule } from '../src/mangas/mangas.module';
import { MangasRepository } from '../src/mangas/mangas.repository';

const mockMangasRepository = {
  createManga: jest.fn((dto) => ({
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'test-slug',
    identifier: '80Vni9G',
    ...dto,
  })),
  save: jest.fn((book) => book),
  find: jest.fn(() => {
    return [mockManga];
  }),
  findOne: jest.fn((payload) => {
    return payload.identifier === 'notfound' ? null : mockManga;
  }),
  delete: jest.fn((payload) => {
    return payload.identifier === 'notfound'
      ? { affected: 0 }
      : { affected: 1 };
  }),
};

const mockManga = {
  title: 'Title',
  author: 'Author',
  publisher: 'Publisher',
  premiered: new Date().toString(),
  draft: false,
};

describe('MangasController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MangasModule, TypeOrmModule.forFeature([MangasRepository])],
    })
      .overrideProvider(MangasRepository)
      .useValue(mockMangasRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/api/mangas (POST)', () => {
    it('returns created Manga and status 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/mangas')
        .send(mockManga)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: expect.any(String),
        ...mockManga,
      });
    });
  });

  describe('/api/mangas (GET)', () => {
    it('returns list of mangas and status 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/mangas')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([mockManga]);
    });
  });

  describe('/api/mangas/:identifier (PATCH)', () => {
    it('manga not found, returns status 404', async () => {
      await request(app.getHttpServer())
        .patch('/api/mangas/notfound')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated Manga and status 200', async () => {
      const updateDto = {
        title: 'Updated',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/mangas/123')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual({ ...mockManga, ...updateDto });
    });
  });

  describe('/api/mangas/:identifier (DELETE)', () => {
    it('manga not found, returns status 404', async () => {
      await request(app.getHttpServer())
        .delete('/api/comics/notfound')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('delets manga and return status 204', async () => {
      await request(app.getHttpServer()).delete('/api/mangas/123').expect(204);
    });
  });
});

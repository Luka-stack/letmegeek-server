import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BooksModule } from '../src/books/books.module';
import { BooksRepository } from '../src/books/books.repository';

const mockBooksRepository = {
  createBook: jest.fn((dto) => ({
    id: '643790b4-ad59-49dc-baec-f5617e700bac',
    slug: 'test-slug',
    identifier: '80Vni9G',
    ...dto,
  })),
  save: jest.fn((book) => book),
  find: jest.fn(() => {
    return [
      {
        title: 'Title',
        author: 'Author',
        publisher: 'Publisher',
        premiered: new Date().toString(),
        draft: false,
      },
    ];
  }),
  findOne: jest.fn((payload) => {
    return payload.identifier === 'notfound' ? null : mockBook;
  }),
  delete: jest.fn((payload) => {
    return payload.identifier === 'notfound'
      ? { affected: 0 }
      : { affected: 1 };
  }),
};

const mockBook = {
  title: 'Title',
  author: 'Author',
  publisher: 'Publisher',
  premiered: new Date().toString(),
  draft: false,
};

describe('BooksControler (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [BooksModule, TypeOrmModule.forFeature([BooksRepository])],
    })
      .overrideProvider(BooksRepository)
      .useValue(mockBooksRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/api/books (POST)', () => {
    it('return created book and status 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/books')
        .send(mockBook)
        .expect('Content-Type', /json/)
        .expect(201);
      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: expect.any(String),
        ...mockBook,
      });
    });
  });

  describe('/api/books (GET)', () => {
    it('return list of books and status 200', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/books')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('/api/books/:identifier (PATH)', () => {
    it('returns status 404', async () => {
      await request(app.getHttpServer())
        .patch('/api/books/notfound')
        .send(mockBook)
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated book and status 200', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/books/123123')
        .send(mockBook)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual(mockBook);
    });
  });

  describe('/api/books/:identifier (DELETE)', () => {
    it('returns status 404', async () => {
      await request(app.getHttpServer())
        .delete('/api/books/notfound')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns status 204', async () => {
      await request(app.getHttpServer()).delete('/api/books/12313').expect(204);
    });
  });
});

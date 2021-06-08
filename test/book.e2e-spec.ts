import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { BooksRepository } from '../src/books/books.repository';
import { BooksService } from '../src/books/books.service';
import { BooksController } from '../src/books/books.controller';
import Book from '../src/books/entities/book.entity';
import { makeId, slugify } from '../src/utils/helpers';

const mockBooksRepository = () => ({
  create: jest.fn((dto) => {
    return {
      id: 'someId',
      identifier: makeId(2),
      slug: slugify(dto.title),
      updatedAt: new Date(),
      createdAt: new Date(),
      ...dto,
    };
  }),
  save: jest.fn(),
  getBooks: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('BooksController (e2e)', () => {
  let app: INestApplication;
  let booksRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // imports: [BooksModule, TypeOrmModule.forFeature([BooksRepository])],
      controllers: [BooksController],
      providers: [
        BooksService,
        { provide: BooksRepository, useFactory: mockBooksRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    booksRepository = moduleFixture.get(BooksRepository);
    await app.init();
  });

  describe('/api/books (POST)', () => {
    it('returns created book and status 201', async () => {
      // given
      booksRepository.save.mockResolvedValue({});

      // when
      const bookDto = {
        title: 'New Title',
        draft: false,
      };
      const response = await request(app.getHttpServer())
        .post('/api/books')
        .send(bookDto)
        .expect('Content-Type', /json/)
        .expect(201);

      // then
      expect(response.body).toEqual({
        id: expect.any(String),
        identifier: expect.any(String),
        slug: slugify(bookDto.title),
        title: bookDto.title,
        draft: bookDto.draft,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('returns status 409, didnt create book due to the title not being unique', async () => {
      // given
      booksRepository.save.mockRejectedValue({ code: 23505 });

      // when
      const bookDto = {
        title: 'New Title',
        draft: false,
      };

      // then
      await request(app.getHttpServer())
        .post('/api/books')
        .send(bookDto)
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/books (GET)', () => {
    it('return list of books and status 200', async () => {
      // given
      booksRepository.getBooks.mockResolvedValue([new Book()]);

      // when
      const response = await request(app.getHttpServer())
        .get('/api/books?name=all')
        .expect('Content-Type', /json/)
        .expect(200);

      // then
      expect(response.body).toHaveLength(1);
    });
  });

  describe('/api/books/:identifier/:slug (PATCH)', () => {
    it('returns status 404', async () => {
      // given
      booksRepository.findOne.mockResolvedValue(null);

      // when, then
      await request(app.getHttpServer())
        .patch('/api/books/identifier/slug')
        .send({})
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns updated book and status 200', async () => {
      // given
      const mockBook = new Book();
      mockBook.title = 'Old Title';

      booksRepository.findOne.mockResolvedValue(mockBook);
      booksRepository.save.mockResolvedValue({});

      // when
      const bookDto = {
        title: 'Updated One',
      };
      const response = await request(app.getHttpServer())
        .patch('/api/books/identifier/slug')
        .send(bookDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.title).toEqual(bookDto.title);
    });

    it('updates draft to true, returns 200 and updated book with updated timestamp', async () => {
      // given
      const date = new Date();
      date.setFullYear(2000);

      const mockBookObject = new Book();
      mockBookObject.createdAt = date;

      booksRepository.findOne.mockResolvedValue(mockBookObject);
      booksRepository.save.mockResolvedValue({});

      // when
      const updatedBook = {
        draft: true,
      };
      const response = await request(app.getHttpServer())
        .patch('/api/books/identifier/slug')
        .send(updatedBook)
        .expect('Content-Type', /json/)
        .expect(200);

      // then
      expect(response.body.createdAt).not.toEqual(date);
    });

    it('updates draft to false, returns 200 and updated book with old timestamp', async () => {
      // given
      const date = new Date();

      const mockBookObject = new Book();
      mockBookObject.createdAt = date;

      booksRepository.findOne.mockResolvedValue(mockBookObject);
      booksRepository.save.mockResolvedValue({});

      // when
      const updatedBook = {
        draft: false,
      };
      const response = await request(app.getHttpServer())
        .patch('/api/books/identifier/slug')
        .send(updatedBook)
        .expect('Content-Type', /json/)
        .expect(200);

      // then
      expect(response.body.createdAt).toEqual(date.toISOString());
    });

    it('returns status 409, didnt create book due to the title not being unique', async () => {
      // given
      booksRepository.findOne.mockResolvedValue(new Book());
      booksRepository.save.mockRejectedValue({ code: 23505 });

      // when, then
      await request(app.getHttpServer())
        .patch('/api/books/identifier/slug')
        .send({})
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/books/:identifier/:slug (DELETE)', () => {
    it('returns status 404', async () => {
      // given
      booksRepository.delete.mockResolvedValue({ affected: 0 });

      // when, then
      await request(app.getHttpServer())
        .delete('/api/books/identifier/slug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('returns status 204', async () => {
      // given
      booksRepository.delete.mockResolvedValue({ affected: 1 });

      // when, then
      await request(app.getHttpServer())
        .delete('/api/books/identifier/slug')
        .expect(204);
    });
  });
});

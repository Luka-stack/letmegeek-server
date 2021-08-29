import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { BooksRepository } from '../../src/articles/books/books.repository';
import { BooksService } from '../../src/articles/books/books.service';
import { BooksController } from '../../src/articles/books/books.controller';
import { JwtStrategy } from '../../src/auth/guards/jwt.strategy';
import User from '../../src/users/entities/user.entity';
import Book from '../../src/articles/books/entities/book.entity';
import { UserRole } from '../../src/auth/entities/user-role';

const mockBooksRepository = () => ({
  create: jest.fn((dto) => {
    const book = new Book();
    book.draft = dto.draft;
    book.title = dto.title;
    return book;
  }),
  save: jest.fn(),
  getFilterCount: jest.fn(),
  getBooks: jest.fn(),
  getBook: jest.fn(),
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

describe('BooksController (e2e)', () => {
  let app: INestApplication;
  let booksRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [BooksController],
      providers: [
        BooksService,
        { provide: BooksRepository, useFactory: mockBooksRepository },
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

    booksRepository = moduleFixture.get(BooksRepository);

    await app.init();
  });

  describe('/api/articles/books (POST)', () => {
    it('Body Validation: empty body; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty title; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        .send({ draft: false })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: empty draft; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: draft not a boolean; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ draft: true, title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: series not a string; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, series: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: pages not a number; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, pages: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, description: true })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt create book; return 400', async () => {
      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true, premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created book only with title and draft in body; return 201', async () => {
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/books')
        // .set('Auth-Cookie', 'User')
        .send({ title: 'Test', draft: true })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Body Validation: created book with all data passed; return 201', async () => {
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .post('/api/articles/books')
        .set('Cookie', 'User')
        .send({
          title: 'Test',
          draft: true,
          series: 'Series',
          pages: 20,
          description: 'Desc',
          genres: '1, 2, 3',
          authors: '11, 22, 33',
          publishers: '111, 222, 333',
          premiered: '2008-09-22',
        })
        .expect('Content-Type', /json/)
        .expect(201);
    });

    it('Authentication: run by User; create draft book; return 201', async () => {
      booksRepository.save.mockResolvedValue({});
      const user = mockUser('User');

      const result = await request(app.getHttpServer())
        .post('/api/articles/books')
        .set('Cookie', 'User')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(true);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(false);
    });

    it('Authentication: run by Admin; create draft book; return 201', async () => {
      booksRepository.save.mockResolvedValue({});
      const user = mockUser('Admin');

      const result = await request(app.getHttpServer())
        .post('/api/articles/books')
        .set('Cookie', 'Admin')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('Authentication: run by Moderator; create draft book; return 201', async () => {
      booksRepository.save.mockResolvedValue({});
      const user = mockUser('Moderator');

      const result = await request(app.getHttpServer())
        .post('/api/articles/books')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.draft).toEqual(false);
      expect(result.body.contributor).toEqual(user.username);
      expect(result.body.accepted).toEqual(true);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      booksRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .post('/api/articles/books')
        .set('Cookie', 'Moderator')
        .send({ title: 'Test', draft: false })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/books (GET)', () => {
    const book = {
      book_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      book_slug: 'title_test',
      book_identifier: '80Vni9G',
      book_title: 'Title Test',
      book_draft: false,
      book_createdAt: '2021-08-27T17:55:02.558Z',
      book_updatedAt: '2021-08-27T17:55:02.558Z',
      book_imageUrl: 'image Path',
      bookStats_avgScore: '5',
      bookStats_countScore: '5',
      bookStats_members: '5',
    };

    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/books')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/books?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/books?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: premiered not a 4 digit long number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/books?page=1&limit=5&premiered=12')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: orderBy not an article name; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/articles/books?page=1&limit=5&orderBy=123')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      booksRepository.getFilterCount.mockResolvedValue(1);
      booksRepository.getBooks.mockResolvedValue([book]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/articles/books?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [book],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      booksRepository.getFilterCount.mockResolvedValue(3);
      booksRepository.getBooks.mockResolvedValue([book]);

      const result = await request(app.getHttpServer())
        .get(
          '/api/articles/books?page=2&limit=1&orderBy=avgScore&ordering=ASC&name=test123',
        )
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [book],
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

  describe('/api/articles/books/:identifier/:slug (GET)', () => {
    const book = {
      book_id: '643790b4-ad59-49dc-baec-f5617e700bac',
      book_slug: 'title_test',
      book_identifier: '80Vni9G',
      book_title: 'Title Test',
      book_draft: false,
      book_createdAt: '2021-08-27T18:12:46.149Z',
      book_updatedAt: '2021-08-27T18:12:46.149Z',
      book_imageUrl: 'image Path',
      bookStats_avgScore: '5',
      bookStats_countScore: '5',
      bookStats_members: '5',
    };

    it('return 404 - NotFoundException, book not found', async () => {
      booksRepository.getBook.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/articles/books/bookId/bookSlug')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 200 - return book', async () => {
      booksRepository.getBook.mockResolvedValue(book);

      const result = await request(app.getHttpServer())
        .get('/api/articles/books/bookId/bookSlug')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual(book);
    });
  });

  describe('/api/articles/books/:identifier/:slug (PATCH)', () => {
    const book = new Book();
    book.title = 'Old Title';
    book.draft = false;

    it('Authentication: run by User; forbidden; return 403', async () => {
      booksRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can update book; return 200', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Authentication: run by Moderator; can update book; return 200', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Moderator')
        .send({ title: 'New Title' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.title).toEqual('New Title');
    });

    it('Body Validation: draft not a boolean; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ draft: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: title not a string; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ title: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: series not a string; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ series: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: pages not a number; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ pages: '123' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: description not a string; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ description: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: genres not a comma separated string; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ genres: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: publishers not a comma separated string; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ publishers: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: authors not a comma separated string; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ authors: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: premiered not a date string; didnt update book; return 400', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockResolvedValue({});

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .send({ premiered: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated book with all data passed; return 201', async () => {
      booksRepository.findOne.mockImplementationOnce(() => {
        const book = new Book();
        book.title = 'TT';
        book.draft = false;
        book.series = 'TT';
        book.pages = 1;
        book.description = 'TT';
        book.genres = 'TT';
        book.authors = 'TT';
        book.publishers = 'TT';
        book.premiered = new Date();
        return book;
      });
      booksRepository.save.mockResolvedValue({});

      const updated = {
        title: 'Test',
        draft: true,
        series: 'Series',
        pages: 20,
        description: 'Desc',
        genres: '1, 2, 3',
        authors: '11, 22, 33',
        publishers: '111, 222, 333',
        premiered: '2008-09-22',
      };

      const result = await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
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

    it('return 404 - NotFoundException, book not found', async () => {
      booksRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('return 409 - ConflictException, title has to be unique', async () => {
      booksRepository.findOne.mockResolvedValue(book);
      booksRepository.save.mockRejectedValue({ code: 23505 });

      await request(app.getHttpServer())
        .patch('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/articles/books/:identifier/:slug (DELETE)', () => {
    it('Authentication: run by User; forbidden; return 403', async () => {
      await request(app.getHttpServer())
        .delete('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by Admin; can delete book; return 204', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Admin')
        .expect(204);
    });

    it('Authentication: run by Moderator; can delete book; return 204', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Moderator')
        .expect(204);
    });

    it('return 404 - NotFoundException, book not found', async () => {
      booksRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/articles/books/bookId/bookSlug')
        .set('Cookie', 'Moderator')
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });
});

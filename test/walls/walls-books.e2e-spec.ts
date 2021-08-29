import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { WallArticleStatus } from '../../src/walls/entities/wall-article-status';
import { BooksRepository } from '../../src/articles/books/books.repository';
import { UserRole } from '../../src/auth/entities/user-role';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import User from '../../src/users/entities/user.entity';
import { WallsBooksController } from '../../src/walls/walls-books/walls-books.controller';
import { WallsBooksRepository } from '../../src/walls/walls-books/walls-books.repository';
import { WallsBooksService } from '../../src/walls/walls-books/walls-books.service';
import Book from '../../src/articles/books/entities/book.entity';
import WallsBook from '../../src/walls/walls-books/entities/walls-book.entity';

const mockBooksRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsBooksRepository = () => ({
  create: jest.fn((dto) => {
    const wallsBook = new WallsBook();
    wallsBook.status = dto.status;
    wallsBook.username = dto.user.username;
    wallsBook.book = dto.book;
    wallsBook.pages = dto.pages;
    wallsBook.finishedAt = dto.finishedAt;
    wallsBook.startedAt = dto.startedAt;
    wallsBook.score = dto.score;
    return wallsBook;
  }),
  findUserRecordByBook: jest.fn(),
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

const mockBook = () => {
  const book = new Book();
  book.title = 'Mock Book';
  return book;
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

describe('WallsBooksController (e2e)', () => {
  let app: INestApplication;
  let wallsBooksRepository;
  let booksRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WallsBooksController],
      providers: [
        WallsBooksService,
        { provide: WallsBooksRepository, useFactory: mockWallsBooksRepository },
        { provide: BooksRepository, useFactory: mockBooksRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    booksRepository = moduleFixture.get(BooksRepository);
    wallsBooksRepository = moduleFixture.get(WallsBooksRepository);

    await app.init();
  });

  describe('/api/wallsbooks/book/:bookIdentifier (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: empty status; wallsbook record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ status: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: score not a number; wallsbook record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallsbook record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({
          status: WallArticleStatus.COMPLETED,
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallsbook record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: pages not a number; wallsbook record not created; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED, pages: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: created wallsbook record; return 201', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.findOne.mockResolvedValue(null);
      wallsBooksRepository.save.mockResolvedValue({});

      const createDto = {
        status: WallArticleStatus.COMPLETED,
        pages: 123,
        finishedAt: new Date(),
        startedAt: new Date(),
        score: 5,
      };

      const result = await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentiifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        book: { title: mockBook().title },
        username: mockUser('User').username,
        status: createDto.status,
        pages: createDto.pages,
        finishedAt: createDto.finishedAt.toISOString(),
        startedAt: createDto.startedAt.toISOString(),
        score: createDto.score,
      });
    });

    it('Throw NotFoundException (404); book not found', async () => {
      booksRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); wallsbook for provided book already exists', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.findOne.mockResolvedValue(new WallsBook());

      await request(app.getHttpServer())
        .post('/api/wallsbooks/book/bookIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(409);
    });
  });

  describe('/api/wallsbooks/:username (GET)', () => {
    it('Return wallsbook records for given user', async () => {
      const wallsBook = new WallsBook();
      wallsBook.status = WallArticleStatus.DROPPED;
      wallsBook.book = mockBook();

      wallsBooksRepository.getRecords.mockResolvedValue([wallsBook]);

      const result = await request(app.getHttpServer())
        .get('/api/wallsbooks/Tester')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([wallsBook]);
    });
  });

  describe('/api/wallsbooks/book/:bookIdentifier (PATCH)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsbooks/book/bookIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: score not a number; wallsbook record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ score: 'qwer' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: startedAt not a date; wallsbook record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({
          startedAt: 123,
        })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: finishedAt not a date; wallsbook record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ finishedAt: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: pages not a number; wallsbook record not updated; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/wallsbooks/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ pages: 'asd' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: updated wallsbook record; return 200', async () => {
      const wallsBook = new WallsBook();
      wallsBook.status = WallArticleStatus.IN_PLANS;
      wallsBook.pages = 0;
      wallsBook.score = 0;

      wallsBooksRepository.findUserRecordByBook.mockResolvedValue(wallsBook);
      wallsBooksRepository.save.mockImplementationOnce((wall) => wall);

      const updateDto = {
        status: WallArticleStatus.COMPLETED,
        pages: 100,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/wallsbooks/book/bookIdentiifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.status).toEqual(updateDto.status);
      expect(result.body.pages).toEqual(updateDto.pages);
      expect(result.body.score).toEqual(wallsBook.score);
    });

    it('Throw NotFoundException (404); wallsbook record not found', async () => {
      wallsBooksRepository.findUserRecordByBook.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/wallsbooks/book/bookIdentiifier')
        .set('Cookie', 'User')
        .send({ status: WallArticleStatus.COMPLETED })
        .expect('Content-Type', /json/)
        .expect(404);
    });
  });

  describe('/api/wallsbooks/book/:bookIdentifier (DELETE)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/wallsbooks/book/bookIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404); wallsbook record not found', async () => {
      wallsBooksRepository.findUserRecordByBook.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/wallsbooks/book/bookIdentiifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw NotFoundException (404); wallsbook record not found', async () => {
      wallsBooksRepository.findUserRecordByBook.mockResolvedValue(
        new WallsBook(),
      );

      await request(app.getHttpServer())
        .delete('/api/wallsbooks/book/bookIdentiifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

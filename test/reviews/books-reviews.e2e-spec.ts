import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { BooksRepository } from '../../src/articles/books/books.repository';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { BooksReviewsController } from '../../src/reviews/books-reviews/books-reviews.controller';
import { BooksReviewsRepository } from '../../src/reviews/books-reviews/books-reviews.repository';
import { BooksReviewsService } from '../../src/reviews/books-reviews/books-reviews.service';
import { WallsBooksRepository } from '../../src/walls/walls-books/walls-books.repository';
import { UserRole } from '../../src/auth/entities/user-role';
import User from '../../src/users/entities/user.entity';
import Book from '../../src/articles/books/entities/book.entity';
import BooksReview from '../../src/reviews/books-reviews/entities/books-review.entity';

const mockBooksRepository = () => ({
  findOne: jest.fn(),
});

const mockWallsBooksRepository = () => ({
  checkUserHasStatusesOnBook: jest.fn(),
});

const mockBooksReviewsRepository = () => ({
  create: jest.fn((dto) => {
    const booksReview = new BooksReview();
    booksReview.review = dto.review;
    booksReview.overall = dto.overall;
    booksReview.art = dto.art;
    booksReview.characters = dto.characters;
    booksReview.story = dto.story;
    booksReview.enjoyment = dto.enjoyment;
    booksReview.book = dto.book;
    booksReview.user = dto.user;
    return booksReview;
  }),
  findOne: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  reviewsCount: jest.fn(),
  getReviewsForBook: jest.fn(),
  getReviewsForUser: jest.fn(),
});

const mockBookReview = (user?: User, book?: Book) => {
  const review = new BooksReview();
  review.user = user;
  review.book = book;
  review.review = 'Some Review';
  review.overall = 9;
  return review;
};

const mockBook = () => {
  const book = new Book();
  book.title = 'Mock Book';
  return book;
};

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
    if (!cookieUser) {
      throw new UnauthorizedException();
    }

    req.user = mockUser(cookieUser);

    return true;
  }),
};

describe('BooksReviewsController (e2e)', () => {
  let app: INestApplication;
  let booksRepository;
  let wallsBooksRepository;
  let booksReviewsRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [BooksReviewsController],
      providers: [
        BooksReviewsService,
        { provide: BooksRepository, useFactory: mockBooksRepository },
        { provide: WallsBooksRepository, useFactory: mockWallsBooksRepository },
        {
          provide: BooksReviewsRepository,
          useFactory: mockBooksReviewsRepository,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    booksRepository = moduleFixture.get(BooksRepository);
    wallsBooksRepository = moduleFixture.get(WallsBooksRepository);
    booksReviewsRepository = moduleFixture.get(BooksReviewsRepository);

    await app.init();
  });

  describe('api/booksreviews/book/:bookIdentifier (POST)', () => {
    it('Authentication: anonymous user cannot create review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: body cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: review cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ overall: 1 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall cannot be empty; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5, enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); book not found', async () => {
      booksRepository.findOne.mockResolvedValue(null);
      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Throw ConflictException (409); user cannot review book due to not having it on their wallsbook', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.checkUserHasStatusesOnBook.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('Throw ConflictException (409); user cannot review more than once the same book', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.checkUserHasStatusesOnBook.mockResolvedValue(true);
      booksReviewsRepository.findOne.mockResolvedValue(new BooksReview());

      await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(409);
    });

    it('created review; return review with status 201', async () => {
      booksRepository.findOne.mockResolvedValue(mockBook());
      wallsBooksRepository.checkUserHasStatusesOnBook.mockResolvedValue(true);
      booksReviewsRepository.findOne.mockResolvedValue(null);

      const createDto = {
        review: 'Review',
        overall: 5,
        art: 1,
        characters: 2,
        story: 3,
        enjoyment: 9,
      };

      const result = await request(app.getHttpServer())
        .post('/api/booksreviews/book/bookIdentifier')
        .set('Cookie', 'User')
        .send(createDto)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body).toEqual({
        user: mockUser('User'),
        book: mockBook(),
        ...createDto,
      });
    });
  });

  describe('/api/booksreviews/book/:bookIdentifier (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/booksreviews/book/bookIdentifier')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/booksreviews/book/bookIdentifier?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/booksreviews/book/bookIdentifier?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockBookReview(mockUser('User'), mockBook());

      booksReviewsRepository.reviewsCount.mockResolvedValue(1);
      booksReviewsRepository.getReviewsForBook.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/booksreviews/book/bookIdentifier?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [review],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      const review = mockBookReview(mockUser('User'), mockBook());

      booksReviewsRepository.reviewsCount.mockResolvedValue(3);
      booksReviewsRepository.getReviewsForBook.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/booksreviews/book/bookIdentifier?page=2&limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [review],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(result.body.nextPage).toMatch(/page=3/);
      expect(result.body.nextPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/bookIdentifier/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/bookIdentifier/);
    });
  });

  describe('/api/booksreviews/user/:username (GET)', () => {
    it('Query Validation: page and limit not set; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/booksreviews/user/username')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/booksreviews/user/username?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; return 400', async () => {
      await request(app.getHttpServer())
        .get('/api/booksreviews/user/username?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      const review = mockBookReview(mockUser('User'), mockBook());

      booksReviewsRepository.reviewsCount.mockResolvedValue(1);
      booksReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/booksreviews/user/username?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [review],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      const review = mockBookReview(mockUser('User'), mockBook());

      booksReviewsRepository.reviewsCount.mockResolvedValue(3);
      booksReviewsRepository.getReviewsForUser.mockResolvedValue([review]);

      const result = await request(app.getHttpServer())
        .get('/api/booksreviews/user/username?page=2&limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [review],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(result.body.nextPage).toMatch(/page=3/);
      expect(result.body.nextPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/username/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/username/);
    });
  });

  describe('/api/booksreviews/:identifier (PATCH)', () => {
    it('Authentication: anonymous user cannot update review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: overall not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .send({ overall: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: art not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .send({ art: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: characters not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .send({ characters: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: story not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .send({ story: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: enjoyment not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .send({ enjoyment: 'qwerty' })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); review not found', async () => {
      booksReviewsRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .send({ review: 'Review', overall: 5 })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('updated review; return review with status 200', async () => {
      const review = mockBookReview(mockUser('User'), mockBook());
      booksReviewsRepository.findOne.mockResolvedValue(review);
      booksReviewsRepository.save.mockImplementationOnce((obj) => obj);

      const updateDto = {
        review: 'new Review',
        overall: 1,
      };

      const result = await request(app.getHttpServer())
        .patch('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .send(updateDto)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        user: mockUser('User'),
        book: mockBook(),
        ...updateDto,
      });
    });
  });

  describe('/api/booksreviews/:identifier (DELETE)', () => {
    it('Authentication: anonymous user cannot delete review; throw AuthorizationException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/booksreviews/identifier')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404), review not found', async () => {
      booksReviewsRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('delete review and return status 204', async () => {
      booksReviewsRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/booksreviews/identifier')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

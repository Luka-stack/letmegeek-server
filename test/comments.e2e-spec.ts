import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

import User from '../src/users/entities/user.entity';
import Comment from '../src/comments/entities/comment.entity';
import { UserRole } from '../src/auth/entities/user-role';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { CommentsService } from '../src/comments/comments.service';
import { CommentsController } from '../src/comments/comments.controller';
import { CommentsRepository } from '../src/comments/comments.repository';
import { UsersRepository } from '../src/users/users.repository';

const mockUserRepository = () => ({
  findOne: jest.fn(),
});

const mockCommentsRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  commentsCount: jest.fn(),
  getCommentsForUser: jest.fn(),
  deleteUserComment: jest.fn(),
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
    if (!cookieUser) {
      throw new UnauthorizedException();
    }

    req.user = mockUser(cookieUser);

    return true;
  }),
};

describe('CommentsController (e2e)', () => {
  let app: INestApplication;
  let commentsRepository;
  let usersRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [CommentsController],
      providers: [
        CommentsService,
        { provide: UsersRepository, useFactory: mockUserRepository },
        { provide: CommentsRepository, useFactory: mockCommentsRepository },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    commentsRepository = moduleFixture.get(CommentsRepository);
    usersRepository = moduleFixture.get(UsersRepository);

    await app.init();
  });

  describe('/api/comments/:username (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/comments/Tester')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Body Validation: comment not provided; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/comments/Tester')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); recipient of the comment not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/comments/Tester')
        .set('Cookie', 'User')
        .send({ comment: 'Some Comment' })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Create comment', async () => {
      const recipient = mockUser('User');
      recipient.username = 'New recipient';

      usersRepository.findOne.mockResolvedValue(recipient);
      commentsRepository.save.mockResolvedValue({});
      commentsRepository.create.mockImplementationOnce((dto) => {
        const com = new Comment();
        com.authorRef = dto.authorRef;
        com.recipientRef = dto.recipientRef;
        com.comment = dto.comment;
        return com;
      });

      const result = await request(app.getHttpServer())
        .post('/api/comments/Tester')
        .set('Cookie', 'User')
        .send({ comment: 'Test Comment' })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(result.body.comment).toEqual('Test Comment');
      expect(result.body.authorRef.username).toEqual(mockUser('User').username);
      expect(result.body.recipientRef.username).toEqual(recipient.username);
    });
  });

  describe('/api/comments/:username (GET)', () => {
    const author = mockUser('User');
    const recipient = mockUser('User');
    recipient.username = 'Friend';

    const comment = new Comment();
    comment.comment = 'Comment :)';
    comment.authorRef = author;
    comment.recipientRef = recipient;

    it('Query Validation: page and limit not set; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/comments/Tester')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/comments/Tester?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/comments/Tester?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      commentsRepository.commentsCount.mockResolvedValue(1);
      commentsRepository.getCommentsForUser.mockResolvedValue([comment]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/comments/Friend?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [comment],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      commentsRepository.commentsCount.mockResolvedValue(3);
      commentsRepository.getCommentsForUser.mockResolvedValue([comment]);

      const result = await request(app.getHttpServer())
        .get('/api/comments/Friend?page=2&limit=1')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [comment],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(result.body.nextPage).toMatch(/page=3/);
      expect(result.body.nextPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/Friend/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.prevPage).toMatch(/Friend/);
    });
  });

  describe('/api/comments/:identifier (DELETE)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/comments/commentId')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404); comment not found', async () => {
      commentsRepository.deleteUserComment.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/comments/commentId')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Comment deleted; run as Administrator, return 204', async () => {
      commentsRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/comments/commentId')
        .set('Cookie', 'Admin')
        .expect(204);
    });

    it('Comment deleted; run as User; return 204', async () => {
      commentsRepository.deleteUserComment.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/comments/commentId')
        .set('Cookie', 'User')
        .expect(204);
    });
  });
});

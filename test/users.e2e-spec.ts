import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import User from '../src/users/entities/user.entity';
import { UserRole } from '../src/auth/entities/user-role';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { UsersController } from '../src/users/users.controller';
import { UsersRepository } from '../src/users/users.repository';
import { UsersService } from '../src/users/users.service';
import { UserStatsService } from '../src/users/user-stats/user-stats.service';
import { JwtStrategy } from '../src/auth/guards/jwt.strategy';

const mockUsersRepository = () => ({
  findOne: jest.fn(),
  getFilterCount: jest.fn(),
  getUserByUsername: jest.fn(),
  getUsers: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
});

const mockUserStatsService = () => ({
  getUsersArticleStats: jest.fn(),
  getLastUsersUpdates: jest.fn(),
});

const mockUser = (role: string) => {
  const user = new User();
  user.username = 'Tester';
  user.email = 'Tester@lmg.com';
  user.contributionPoints = 0;
  user.blocked = false;
  user.enabled = true;

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

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersRepository;
  let userStatsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
        { provide: UserStatsService, useFactory: mockUserStatsService },
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

    usersRepository = moduleFixture.get(UsersRepository);
    userStatsService = moduleFixture.get(UserStatsService);

    await app.init();
  });

  describe('/api/users (GET)', () => {
    it('Query Validation: page and limit not set; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: page not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users?page=qwerty&limit=20')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: limit not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users?page=1&limit=qwerty')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: isBlocked not a bool value; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users?page=1&limit=1&isBlocked=1234')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('return 200, paginated data, no prev and next pages', async () => {
      usersRepository.getFilterCount.mockResolvedValue(1);
      usersRepository.getUsers.mockResolvedValue([mockUser('User')]);

      const limit = 5;
      const page = 1;

      const result = await request(app.getHttpServer())
        .get('/api/users?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: limit,
        page: page,
        data: [mockUser('User')],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return 200, paginated data, has prev and next pages', async () => {
      usersRepository.getFilterCount.mockResolvedValue(3);
      usersRepository.getUsers.mockResolvedValue([mockUser('User')]);

      const result = await request(app.getHttpServer())
        .get(
          '/api/users?page=2&limit=1&username=Tester&ordering=ASC&isBlocked=false',
        )
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({
        totalCount: expect.any(Number),
        limit: 1,
        page: 2,
        data: [mockUser('User')],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(result.body.nextPage).toMatch(/page=3/);
      expect(result.body.nextPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/username=Tester/);
      expect(result.body.nextPage).toMatch(/ordering=ASC/);
      expect(result.body.nextPage).toMatch(/isBlocked=false/);

      expect(result.body.prevPage).toMatch(/page=1/);
      expect(result.body.prevPage).toMatch(/limit=1/);
      expect(result.body.nextPage).toMatch(/username=Tester/);
      expect(result.body.nextPage).toMatch(/ordering=ASC/);
      expect(result.body.nextPage).toMatch(/isBlocked=false/);
    });
  });

  describe('/api/users/sendContributionPoints/:username (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/sendContributionPoints/Tester')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Authentication: not an admin user or moderator user; throw ForbiddenException (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/sendContributionPoints/Tester')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Throw NotFoundException (404); user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/users/sendContributionPoints/Tester')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Add contribution point to user; return 200', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser('User'));

      const result = await request(app.getHttpServer())
        .post('/api/users/sendContributionPoints/Tester')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual({ message: expect.any(String) });
    });
  });

  describe('/api/users/:username/blocked (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/blocked')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Authentication: run by plain user; throw ForbiddenException (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/blocked')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by moderator; throw ForbiddenException (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/blocked')
        .set('Cookie', 'Moderator')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Throw NotFoundException (404); user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/users/Tester/blocked')
        .set('Cookie', 'Admin')
        .send({ status: false })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Body Validation: status not send; Throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/blocked')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: status not a boolean; Throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/blocked')
        .set('Cookie', 'Admin')
        .send({ status: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Users blocked status updated; return 200', async () => {
      const user = mockUser('User');
      user.blocked = false;

      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .post('/api/users/Tester/blocked')
        .set('Cookie', 'Admin')
        .send({ status: true })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.blocked).toEqual(user.blocked);
    });
  });

  describe('/api/users/:username/role (POST)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/role')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Authentication: run by plain user; throw ForbiddenException (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/role')
        .set('Cookie', 'User')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Authentication: run by moderator; throw ForbiddenException (403)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/role')
        .set('Cookie', 'Moderator')
        .expect('Content-Type', /json/)
        .expect(403);
    });

    it('Throw NotFoundException (404); user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/users/Tester/role')
        .set('Cookie', 'Admin')
        .send({ role: UserRole.MODERATOR })
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('Body Validation: status not send; Throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/role')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Body Validation: status not a UserRole; Throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .post('/api/users/Tester/role')
        .set('Cookie', 'Admin')
        .send({ status: 123 })
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Users role updated; return 200', async () => {
      const user = mockUser('User');

      usersRepository.findOne.mockResolvedValue(user);
      usersRepository.save.mockResolvedValue({});

      const result = await request(app.getHttpServer())
        .post('/api/users/Tester/role')
        .set('Cookie', 'Admin')
        .send({ role: UserRole.MODERATOR })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.role).toEqual(user.role);
    });
  });

  describe('/api/users/account (DELETE)', () => {
    it('Authorization: not a user; throw UnauthorizedException (401)', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/account')
        .expect('Content-Type', /json/)
        .expect(401);
    });

    it('Throw NotFoundException (404); user not found', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 0 });

      await request(app.getHttpServer())
        .delete('/api/users/account')
        .set('Cookie', 'Admin')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    it('account deleted; return 204', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .delete('/api/users/account')
        .set('Cookie', 'Admin')
        .expect(204);
    });
  });

  describe('/api/users/:username (GET)', () => {
    it('Query Validation: article not an ArticleName; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users/Tester?article=12312313')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: lastUpdates not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users/Tester?lastUpdates=qwert')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: lastUpdates number higher than 5; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users/Tester?lastUpdates=8')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: lastComments not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users/Tester?lastComments=qwert')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: lastReviews not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users/Tester?lastReviews=qwert')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Throw NotFoundException (404); user not found', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/users/Tester')
        .expect('Content-Type', /json/)
        .expect(404);
    });

    const user = mockUser('User');

    const mockStats = {
      status: 'IN_PROGRESS',
      avgScore: '10.0000000000000000',
      count: '1',
    };

    const mockBookLastUpdate = {
      status: 'IN_PROGRESS',
      score: 10,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-28T13:33:34.286Z',
      pages: 700,
      startedAt: '2021-01-01T00:00:00.000Z',
      finishedAt: null,
      book: {
        identifier: 'dMvkmaie',
        slug: 'house_of_earth_and_blood_test',
        title: 'House of Earth and Blood Test',
        description:
          'Bryce Quinlan had the perfect life—working hard all day and partying all night—until a demon murdered her closest friends, leaving her bereft, wounded, and alone. When the accused is behind bars but the crimes start up again, Bryce finds herself at the heart of the investigation.',
        authors: 'Sarah J. Maas',
        publishers: 'Bloomsbury Publishing',
        genres: 'fantasy,romance',
        draft: false,
        contributor: null,
        accepted: null,
        createdAt: '2021-07-28T14:49:49.076Z',
        updatedAt: '2021-07-28T14:49:48.273Z',
        series: 'Crescent City',
        premiered: '2020-03-03T00:00:00.000Z',
        pages: 803,
        volume: 1,
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    const mockComicLastUpdate = {
      status: 'IN_PROGRESS',
      score: 6,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:02:35.837Z',
      issues: 25,
      startedAt: null,
      finishedAt: '2021-05-05T00:00:00.000Z',
      comic: {
        identifier: 'DGykCRP4',
        slug: 'the_boys_t1',
        title: 'The Boys T1',
        description:
          "Garth Ennis and Darick Robertson bring you THE BOYS. Wee Hughie was an average guy with everything going for him. A fiancee at his side, things were perfect...at least until every thing was torn away by a super hero! In this world, the superheroes are ungrateful uncaring asses. The comic follows the story of Wee Hughie as he is recruited too and later joins The Boys, a CIA black ops team dealing with super powered threats. The team consists of five super-powered beings made to deal with the incidents just like Hughie's.",
        authors: 'Garth Ennis',
        publishers: 'Dynamic',
        genres: 'drama,gore,mature,supernatural',
        draft: false,
        contributor: null,
        accepted: null,
        createdAt: '2021-07-17T18:14:27.779Z',
        updatedAt: '2021-07-17T18:14:27.782Z',
        issues: 72,
        finished: '2016-05-13T00:00:00.000Z',
        premiered: '2006-01-01T00:00:00.000Z',
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    const mockMangaLastUpdate = {
      status: 'IN_PROGRESS',
      score: 7,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:39:27.488Z',
      volumes: 50,
      chapters: 150,
      startedAt: null,
      finishedAt: null,
      manga: {
        identifier: '2t8Vh0Hf',
        slug: 'manga_postman_test',
        title: 'Manga Postman Test',
        description: null,
        authors: null,
        publishers: null,
        genres: null,
        draft: true,
        contributor: null,
        accepted: null,
        createdAt: '2021-08-22T13:36:53.167Z',
        updatedAt: '2021-08-22T13:36:52.360Z',
        volumes: null,
        chapters: null,
        premiered: null,
        finished: null,
        type: null,
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    const mockGameLastUpdate = {
      status: 'IN_PROGRESS',
      score: 8,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:31:27.322Z',
      hoursPlayed: 15,
      startedAt: null,
      finishedAt: null,
      game: {
        identifier: 'UMXdUzpV',
        slug: 'game_postman_test',
        title: 'Game Postman Test',
        description: null,
        authors: null,
        publishers: null,
        genres: null,
        draft: true,
        contributor: null,
        accepted: null,
        createdAt: '2021-08-22T13:05:04.845Z',
        updatedAt: '2021-08-22T13:05:04.039Z',
        premiered: null,
        completeTime: null,
        gameMode: null,
        gears: null,
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    it('return user details', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(user);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual(user);
    });

    it('return user details with wallsbooks statistics', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(mockUser('User'));
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockBookLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester?article=books')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.username).toEqual(user.username);
      expect(result.body.statistics).toEqual([
        {
          article: 'books',
          numericStats: [mockStats],
          lastUpdates: [mockBookLastUpdate],
        },
      ]);
    });

    it('return user details with wallscomics statistics', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(mockUser('User'));
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockComicLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester?article=comics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.username).toEqual(user.username);
      expect(result.body.statistics).toEqual([
        {
          article: 'comics',
          numericStats: [mockStats],
          lastUpdates: [mockComicLastUpdate],
        },
      ]);
    });

    it('return user details with wallsmangas statistics', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(mockUser('User'));
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockMangaLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester?article=mangas')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.username).toEqual(user.username);
      expect(result.body.statistics).toEqual([
        {
          article: 'mangas',
          numericStats: [mockStats],
          lastUpdates: [mockMangaLastUpdate],
        },
      ]);
    });

    it('return user details with wallsgames statistics', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(mockUser('User'));
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockGameLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester?article=games')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body.username).toEqual(user.username);
      expect(result.body.statistics).toEqual([
        {
          article: 'games',
          numericStats: [mockStats],
          lastUpdates: [mockGameLastUpdate],
        },
      ]);
    });
  });

  describe('/api/users/:username/stats (GET)', () => {
    it('Query Validation: article not an ArticleName; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users/Tester/stats?article=12312313')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    it('Query Validation: lastUpdates not a number; throw BadRequest (400)', async () => {
      await request(app.getHttpServer())
        .get('/api/users/Tester/stats?lastUpdates=qwert')
        .expect('Content-Type', /json/)
        .expect(400);
    });

    const user = mockUser('User');

    const mockStats = {
      status: 'IN_PROGRESS',
      avgScore: '10.0000000000000000',
      count: '1',
    };

    const mockBookLastUpdate = {
      status: 'IN_PROGRESS',
      score: 10,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-28T13:33:34.286Z',
      pages: 700,
      startedAt: '2021-01-01T00:00:00.000Z',
      finishedAt: null,
      book: {
        identifier: 'dMvkmaie',
        slug: 'house_of_earth_and_blood_test',
        title: 'House of Earth and Blood Test',
        description:
          'Bryce Quinlan had the perfect life—working hard all day and partying all night—until a demon murdered her closest friends, leaving her bereft, wounded, and alone. When the accused is behind bars but the crimes start up again, Bryce finds herself at the heart of the investigation.',
        authors: 'Sarah J. Maas',
        publishers: 'Bloomsbury Publishing',
        genres: 'fantasy,romance',
        draft: false,
        contributor: null,
        accepted: null,
        createdAt: '2021-07-28T14:49:49.076Z',
        updatedAt: '2021-07-28T14:49:48.273Z',
        series: 'Crescent City',
        premiered: '2020-03-03T00:00:00.000Z',
        pages: 803,
        volume: 1,
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    const mockComicLastUpdate = {
      status: 'IN_PROGRESS',
      score: 6,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:02:35.837Z',
      issues: 25,
      startedAt: null,
      finishedAt: '2021-05-05T00:00:00.000Z',
      comic: {
        identifier: 'DGykCRP4',
        slug: 'the_boys_t1',
        title: 'The Boys T1',
        description:
          "Garth Ennis and Darick Robertson bring you THE BOYS. Wee Hughie was an average guy with everything going for him. A fiancee at his side, things were perfect...at least until every thing was torn away by a super hero! In this world, the superheroes are ungrateful uncaring asses. The comic follows the story of Wee Hughie as he is recruited too and later joins The Boys, a CIA black ops team dealing with super powered threats. The team consists of five super-powered beings made to deal with the incidents just like Hughie's.",
        authors: 'Garth Ennis',
        publishers: 'Dynamic',
        genres: 'drama,gore,mature,supernatural',
        draft: false,
        contributor: null,
        accepted: null,
        createdAt: '2021-07-17T18:14:27.779Z',
        updatedAt: '2021-07-17T18:14:27.782Z',
        issues: 72,
        finished: '2016-05-13T00:00:00.000Z',
        premiered: '2006-01-01T00:00:00.000Z',
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    const mockMangaLastUpdate = {
      status: 'IN_PROGRESS',
      score: 7,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:39:27.488Z',
      volumes: 50,
      chapters: 150,
      startedAt: null,
      finishedAt: null,
      manga: {
        identifier: '2t8Vh0Hf',
        slug: 'manga_postman_test',
        title: 'Manga Postman Test',
        description: null,
        authors: null,
        publishers: null,
        genres: null,
        draft: true,
        contributor: null,
        accepted: null,
        createdAt: '2021-08-22T13:36:53.167Z',
        updatedAt: '2021-08-22T13:36:52.360Z',
        volumes: null,
        chapters: null,
        premiered: null,
        finished: null,
        type: null,
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    const mockGameLastUpdate = {
      status: 'IN_PROGRESS',
      score: 8,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:31:27.322Z',
      hoursPlayed: 15,
      startedAt: null,
      finishedAt: null,
      game: {
        identifier: 'UMXdUzpV',
        slug: 'game_postman_test',
        title: 'Game Postman Test',
        description: null,
        authors: null,
        publishers: null,
        genres: null,
        draft: true,
        contributor: null,
        accepted: null,
        createdAt: '2021-08-22T13:05:04.845Z',
        updatedAt: '2021-08-22T13:05:04.039Z',
        premiered: null,
        completeTime: null,
        gameMode: null,
        gears: null,
        imageUrl: 'https://via.placeholder.com/225x320',
      },
    };

    it('return user details with wallsbooks statistics', async () => {
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockBookLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester/stats?article=books')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([
        {
          article: 'books',
          numericStats: [mockStats],
          lastUpdates: [mockBookLastUpdate],
        },
      ]);
    });

    it('return user details with wallscomics statistics', async () => {
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockComicLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester/stats?article=comics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([
        {
          article: 'comics',
          numericStats: [mockStats],
          lastUpdates: [mockComicLastUpdate],
        },
      ]);
    });

    it('return user details with wallsmangas statistics', async () => {
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockMangaLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester/stats?article=mangas')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([
        {
          article: 'mangas',
          numericStats: [mockStats],
          lastUpdates: [mockMangaLastUpdate],
        },
      ]);
    });

    it('return user details with wallsgames statistics', async () => {
      userStatsService.getUsersArticleStats.mockResolvedValue([mockStats]);
      userStatsService.getLastUsersUpdates.mockResolvedValue([
        mockGameLastUpdate,
      ]);

      const result = await request(app.getHttpServer())
        .get('/api/users/Tester/stats?article=games')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(result.body).toEqual([
        {
          article: 'games',
          numericStats: [mockStats],
          lastUpdates: [mockGameLastUpdate],
        },
      ]);
    });
  });
});

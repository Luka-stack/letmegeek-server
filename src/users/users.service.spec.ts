import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import User from './entities/user.entity';
import { UserRole } from '../auth/entities/user-role';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserUpdateRoleDto, UserUpdateStatusDto } from './dto/user-update.dto';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { WallsBooksRepository } from '../walls/walls-books/walls-books.repository';
import { UserStatsService } from './user-stats/user-stats.service';
import { WallsMangasRepository } from '../walls/walls-mangas/walls-mangas.repository';
import { WallsComicsRepository } from '../walls/walls-comics/walls-comics.repository';
import { WallsGamesRepository } from '../walls/walls-games/walls-games.repository';
import { UserDetailsFilterDto } from './dto/user-details-filter.dto';

const mockUsersRepository = () => ({
  save: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  getUsers: jest.fn(),
  getFilterCount: jest.fn(),
  getUserByUsername: jest.fn(),
});

const wallBook = () => ({
  createQueryBuilder: jest.fn(),
  find: jest.fn(),
});

const mockUser = () => {
  const user = new User();
  user.username = 'Test';
  user.email = 'Test@tt.com';
  user.contributionPoints = 0;
  return user;
};

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository;
  let wallBooksRepository;
  let wallComicsRepository;
  let wallGamesRepository;
  let wallMangasRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
        // UserStatsModule,
      ],
      providers: [
        UserStatsService,
        { provide: WallsBooksRepository, useFactory: wallBook },
        { provide: WallsMangasRepository, useFactory: wallBook },
        { provide: WallsComicsRepository, useFactory: wallBook },
        { provide: WallsGamesRepository, useFactory: wallBook },
        UsersService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
    wallBooksRepository = module.get(WallsBooksRepository);
    wallMangasRepository = module.get(WallsMangasRepository);
    wallGamesRepository = module.get(WallsGamesRepository);
    wallComicsRepository = module.get(WallsComicsRepository);
  });

  describe('getUsers', () => {
    const usersFilter = new UserFilterDto();

    it('return paginated data : total count 0, no prev, no next, no users', async () => {
      usersRepository.getFilterCount.mockResolvedValue(0);
      usersRepository.getUsers.mockResolvedValue([]);

      usersFilter.page = 0;
      usersFilter.limit = 1;

      const response = await usersService.getUsers(usersFilter);

      expect(response).toEqual({
        totalCount: 0,
        page: usersFilter.page,
        limit: usersFilter.limit,
        data: [],
        nextPage: '',
        prevPage: '',
      });
    });

    it('return paginated data : total count 2, no prev page, has next page, has users', async () => {
      usersRepository.getFilterCount.mockResolvedValue(2);
      usersRepository.getUsers.mockResolvedValue([mockUser(), mockUser()]);

      usersFilter.page = 0;
      usersFilter.limit = 1;

      const response = await usersService.getUsers(usersFilter);

      expect(response).toEqual({
        totalCount: 2,
        page: usersFilter.page,
        limit: usersFilter.limit,
        data: [mockUser(), mockUser()],
        nextPage: expect.any(String),
        prevPage: '',
      });

      expect(response.nextPage).toMatch(/users/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);
    });

    it('return paginated data : total count 3, has prev page, has next page, has users', async () => {
      usersRepository.getFilterCount.mockResolvedValue(3);
      usersRepository.getUsers.mockResolvedValue([
        mockUser(),
        mockUser(),
        mockUser(),
      ]);

      usersFilter.page = 2;
      usersFilter.limit = 1;

      const response = await usersService.getUsers(usersFilter);

      expect(response).toEqual({
        totalCount: 3,
        page: usersFilter.page,
        limit: usersFilter.limit,
        data: [mockUser(), mockUser(), mockUser()],
        nextPage: expect.any(String),
        prevPage: expect.any(String),
      });

      expect(response.nextPage).toMatch(/user/);
      expect(response.nextPage).toMatch(/page/);
      expect(response.nextPage).toMatch(/limit/);

      expect(response.prevPage).toMatch(/user/);
      expect(response.prevPage).toMatch(/page/);
      expect(response.prevPage).toMatch(/limit/);
    });

    it('return paginated data : returned data contains actual user', async () => {
      const testUser = mockUser();
      testUser.username = 'Test Username';

      usersRepository.getFilterCount.mockResolvedValue(3);
      usersRepository.getUsers.mockResolvedValue([
        testUser,
        mockUser(),
        mockUser(),
      ]);

      usersFilter.page = 2;
      usersFilter.limit = 1;

      const response = await usersService.getUsers(usersFilter);

      expect(response.data[0]).toEqual(testUser);
    });
  });

  describe('getUserByUsername', () => {
    const userDetailsFilter = new UserDetailsFilterDto();
    const numericStat = {
      status: 'COMPLETED',
      avgScore: '9.0000000000000000',
      count: '1',
    };

    const gameUpdate = {
      status: 'IN_PROGRESS',
      score: 8,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:31:27.322Z',
      hoursPlayed: 15,
      startedAt: null,
      finishedAt: null,
    };

    const mangaUpdate = {
      status: 'IN_PROGRESS',
      score: 7,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:39:27.488Z',
      volumes: 50,
      chapters: 150,
      startedAt: null,
      finishedAt: null,
    };

    const comicUpdate = {
      status: 'IN_PROGRESS',
      score: 6,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T13:02:35.837Z',
      issues: 25,
      startedAt: null,
      finishedAt: '2021-05-05T00:00:00.000Z',
    };

    const bookUpdate = {
      status: 'COMPLETED',
      score: 9,
      username: 'UserPostmanTester',
      updatedAt: '2021-08-22T12:44:44.466Z',
      pages: 700,
      startedAt: '2021-01-01T00:00:00.000Z',
      finishedAt: null,
    };

    it('throw NotFoundException (404), user with provided username doesnt exsit', async () => {
      userDetailsFilter.articleStats = '';
      userDetailsFilter.lastUpdates = '2';

      usersRepository.getUserByUsername.mockResolvedValue(null);

      expect(
        usersService.getUserByUsername('username', userDetailsFilter),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return User with provided username', async () => {
      userDetailsFilter.articleStats = undefined;
      usersRepository.getUserByUsername.mockResolvedValue(mockUser());

      const result = await usersService.getUserByUsername(
        'username',
        userDetailsFilter,
      );

      expect(result).toEqual(mockUser());
    });

    it('return User with provided username and books statistics and default last updates', async () => {
      const createQueryBuilder: any = {
        select: () => createQueryBuilder,
        addSelect: () => createQueryBuilder,
        groupBy: () => createQueryBuilder,
        where: () => createQueryBuilder,
        getRawMany: () => [numericStat],
      };

      userDetailsFilter.articleStats = 'books';
      usersRepository.getUserByUsername.mockResolvedValue(mockUser());
      wallBooksRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallBooksRepository.find.mockResolvedValue([
        bookUpdate,
        bookUpdate,
        bookUpdate,
      ]);

      const result = await usersService.getUserByUsername(
        'username',
        userDetailsFilter,
      );

      expect(result.statistics.length).toEqual(1);
      expect(result.statistics[0].article).toEqual('books');
      expect(result.statistics[0].numericStats).toEqual([numericStat]);
      expect(result.statistics[0].lastUpdates).toEqual([
        bookUpdate,
        bookUpdate,
        bookUpdate,
      ]);
    });

    it('return User with provided username and comics statistics and 1 last update', async () => {
      const createQueryBuilder: any = {
        select: () => createQueryBuilder,
        addSelect: () => createQueryBuilder,
        groupBy: () => createQueryBuilder,
        where: () => createQueryBuilder,
        getRawMany: () => [numericStat],
      };

      userDetailsFilter.articleStats = 'comics';
      userDetailsFilter.lastUpdates = '1';
      usersRepository.getUserByUsername.mockResolvedValue(mockUser());
      wallComicsRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallComicsRepository.find.mockResolvedValue([comicUpdate]);

      const result = await usersService.getUserByUsername(
        'username',
        userDetailsFilter,
      );

      expect(result.statistics.length).toEqual(1);
      expect(result.statistics[0].article).toEqual('comics');
      expect(result.statistics[0].numericStats).toEqual([numericStat]);
      expect(result.statistics[0].lastUpdates).toEqual([comicUpdate]);
    });

    it('return User with provided username and mangas statistics and 1 last update', async () => {
      const createQueryBuilder: any = {
        select: () => createQueryBuilder,
        addSelect: () => createQueryBuilder,
        groupBy: () => createQueryBuilder,
        where: () => createQueryBuilder,
        getRawMany: () => [numericStat],
      };

      userDetailsFilter.articleStats = 'mangas';
      userDetailsFilter.lastUpdates = '1';
      usersRepository.getUserByUsername.mockResolvedValue(mockUser());
      wallMangasRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallMangasRepository.find.mockResolvedValue([mangaUpdate]);

      const result = await usersService.getUserByUsername(
        'username',
        userDetailsFilter,
      );

      expect(result.statistics.length).toEqual(1);
      expect(result.statistics[0].article).toEqual('mangas');
      expect(result.statistics[0].numericStats).toEqual([numericStat]);
      expect(result.statistics[0].lastUpdates).toEqual([mangaUpdate]);
    });

    it('return User with provided username and games statistics and 1 last update', async () => {
      const createQueryBuilder: any = {
        select: () => createQueryBuilder,
        addSelect: () => createQueryBuilder,
        groupBy: () => createQueryBuilder,
        where: () => createQueryBuilder,
        getRawMany: () => [numericStat],
      };

      userDetailsFilter.articleStats = 'games';
      userDetailsFilter.lastUpdates = '1';
      usersRepository.getUserByUsername.mockResolvedValue(mockUser());
      wallGamesRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallGamesRepository.find.mockResolvedValue([gameUpdate]);

      const result = await usersService.getUserByUsername(
        'username',
        userDetailsFilter,
      );

      expect(result.statistics.length).toEqual(1);
      expect(result.statistics[0].article).toEqual('games');
      expect(result.statistics[0].numericStats).toEqual([numericStat]);
      expect(result.statistics[0].lastUpdates).toEqual([gameUpdate]);
    });

    it('return User with provided username and all articles statistics and 1 last update', async () => {
      const createQueryBuilder: any = {
        select: () => createQueryBuilder,
        addSelect: () => createQueryBuilder,
        groupBy: () => createQueryBuilder,
        where: () => createQueryBuilder,
        getRawMany: () => [numericStat],
      };

      userDetailsFilter.articleStats = 'all';
      userDetailsFilter.lastUpdates = '1';

      usersRepository.getUserByUsername.mockResolvedValue(mockUser());
      wallGamesRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallBooksRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallComicsRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallMangasRepository.createQueryBuilder.mockImplementationOnce(
        () => createQueryBuilder,
      );
      wallGamesRepository.find.mockResolvedValue([gameUpdate]);
      wallBooksRepository.find.mockResolvedValue([bookUpdate]);
      wallComicsRepository.find.mockResolvedValue([comicUpdate]);
      wallMangasRepository.find.mockResolvedValue([mangaUpdate]);

      const result = await usersService.getUserByUsername(
        'username',
        userDetailsFilter,
      );

      expect(result.statistics.length).toEqual(4);
      expect(result.statistics).toEqual([
        {
          article: 'books',
          numericStats: [numericStat],
          lastUpdates: [bookUpdate],
        },
        {
          article: 'comics',
          numericStats: [numericStat],
          lastUpdates: [comicUpdate],
        },
        {
          article: 'mangas',
          numericStats: [numericStat],
          lastUpdates: [mangaUpdate],
        },
        {
          article: 'games',
          numericStats: [numericStat],
          lastUpdates: [gameUpdate],
        },
      ]);
    });
  });

  describe('changeUserBlockedStatus', () => {
    const updateDto = new UserUpdateStatusDto();

    it('throw NotFoundException (404), attempt to change blocked status on user that doesnt exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      expect(
        usersService.changeUserBlockedStatus('username', updateDto),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return User, successfully changed Blocked status to true', async () => {
      const user = mockUser();
      user.blocked = false;

      updateDto.status = true;

      usersRepository.findOne.mockResolvedValue(user);

      const response = await usersService.changeUserBlockedStatus(
        'username',
        updateDto,
      );

      expect(response.blocked).toEqual(updateDto.status);
    });

    it('return User, successfully changed Blocked status to false', async () => {
      const user = mockUser();
      user.blocked = true;

      updateDto.status = false;

      usersRepository.findOne.mockResolvedValue(user);

      const response = await usersService.changeUserBlockedStatus(
        'username',
        updateDto,
      );

      expect(response.blocked).toEqual(updateDto.status);
    });
  });

  describe('changeUserRole', () => {
    const updateDto = new UserUpdateRoleDto();

    it('throw NotFoundException (404), attempt to change role for user that doesnt exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      expect(
        usersService.changeUserRole('username', null),
      ).rejects.toThrowError(NotFoundException);
    });

    it('return User, successfully changed user role', async () => {
      const user = mockUser();
      user.role = UserRole.USER;

      updateDto.role = UserRole.MODERATOR;

      usersRepository.findOne.mockResolvedValue(user);

      const response = await usersService.changeUserRole('username', updateDto);

      expect(response.role).toEqual(updateDto.role);
    });
  });

  describe('deleteUsersAccount', () => {
    it('throw NotFoundException (404), attempt to delete user that doesnt exist', async () => {
      usersRepository.delete.mockResolvedValue({ affected: 0 });

      expect(usersService.deleteUsersAccount(mockUser())).rejects.toThrowError(
        NotFoundException,
      );
    });
  });
});

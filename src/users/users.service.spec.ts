import { NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import User from './entities/user.entity';
import { UserRole } from '../auth/entities/user-role';
import { UserFilterDto } from './dto/user-filter.dto';
import { UserUpdateRoleDto, UserUpdateStatusDto } from './dto/user-update.dto';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

const mockUsersRepository = () => ({
  save: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  getUsers: jest.fn(),
  getFilterCount: jest.fn(),
  getUserByUsername: jest.fn(),
});

const mockUser = () => {
  const user = new User();
  user.username = 'Test';
  user.email = 'Test@tt.com';
  return user;
};

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: [`.env.stage.${process.env.STAGE}`],
        }),
      ],
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
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
  });

  describe('getUserByUsername', () => {
    it('throw NotFoundException (404), user with provided username doesnt exsit', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(null);

      expect(usersService.getUserByUsername('username')).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('return user associated with provided username', async () => {
      usersRepository.getUserByUsername.mockResolvedValue(mockUser());

      const response = await usersService.getUserByUsername('usernmae');

      expect(response).toEqual(mockUser());
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

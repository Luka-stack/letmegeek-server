import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import User from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

const mockUsersRepository = () => ({
  findOne: jest.fn(),
  getUsers: jest.fn(),
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
  let usersRepositroy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useFactory: mockUsersRepository },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    usersRepositroy = module.get(UsersRepository);
  });

  describe('getUsers', () => {
    it('return list of User', async () => {
      usersRepositroy.getUsers.mockResolvedValue([mockUser()]);

      const response = await usersService.getUsers({ username: 'username' });

      expect(response).toEqual([mockUser()]);
    });
  });

  describe('getUserByUsername', () => {
    it('throw NotFoundException (404), user with provided username doesnt exsit', async () => {
      usersRepositroy.getUserByUsername.mockResolvedValue(null);

      expect(usersService.getUserByUsername('username')).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('return user associated with provided username', async () => {
      usersRepositroy.getUserByUsername.mockResolvedValue(mockUser());

      const response = await usersService.getUserByUsername('usernmae');

      expect(response).toEqual(mockUser());
    });
  });
});

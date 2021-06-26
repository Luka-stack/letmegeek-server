import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import User from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
  ) {}

  getUsers(username: string): Promise<Array<User>> {
    return this.usersRepository.getUsers(username);
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ username });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

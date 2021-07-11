import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import User from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
  ) {}

  getUsers(userFilterDto: UserFilterDto): Promise<Array<User>> {
    return this.usersRepository.getUsers(userFilterDto);
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.getUserByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}

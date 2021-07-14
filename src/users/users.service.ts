import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';

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

  async uploadProfileImage(
    file: Express.Multer.File,
    user: User,
  ): Promise<User> {
    const oldImage = user.imageUrn || '';
    user.imageUrn = file.filename;

    await this.usersRepository.save(user);

    if (oldImage !== '') {
      fs.unlinkSync(`public\\profileImages\\${oldImage}`);
    }

    return user;
  }
}

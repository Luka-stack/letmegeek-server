import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import User from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';
import { UsersRepository } from './users.repository';
import { UserUpdateRoleDto, UserUpdateStatusDto } from './dto/user-update.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}

  async getUsers(filterDto: UserFilterDto): Promise<PaginatedUsersDto> {
    filterDto.limit = Number(filterDto.limit);
    filterDto.page = Number(filterDto.page);

    const totalCount = await this.usersRepository.getFilterCount(filterDto);
    const users = await this.usersRepository.getUsers(filterDto);

    const apiQuery = this.createQuery(filterDto);
    const nextPage = `${this.configService.get(
      'APP_URL',
    )}/api/users?${apiQuery}page=${filterDto.page + 1}&limit=${
      filterDto.limit
    }`;
    const prevPage = `${this.configService.get(
      'APP_URL',
    )}/api/users?${apiQuery}page=${filterDto.page - 1}&limit=${
      filterDto.limit
    }`;

    return {
      totalCount,
      page: filterDto.page,
      limit: filterDto.limit,
      data: users,
      nextPage: filterDto.page * filterDto.limit < totalCount ? nextPage : '',
      prevPage: filterDto.page >= 2 ? prevPage : '',
    };
  }

  async getUserByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.getUserByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changeUserBlockedStatus(
    username: string,
    userUpdateDto: UserUpdateStatusDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.blocked = userUpdateDto.status;
    await this.usersRepository.save(user);

    return user;
  }

  async changeUserRole(
    username: string,
    userRoleDto: UserUpdateRoleDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ username });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = userRoleDto.role;
    await this.usersRepository.save(user);

    return user;
  }

  async deleteUsersAccount(user: User): Promise<void> {
    const result = await this.usersRepository.delete({
      username: user.username,
    });

    if (result.affected == 0) {
      throw new NotFoundException('User not found');
    }
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

  createQuery(filterDto: UserFilterDto): string {
    const ordering =
      filterDto.order === 'ASC' || filterDto.order === 'ASCENDING'
        ? 'ASC'
        : 'DESC';
    let query = `order=${ordering}&`;

    if (filterDto.username) {
      query += `username=${filterDto.username}&`;
    }

    if (filterDto.isBlocked) {
      query += `isBlocked=${filterDto.isBlocked}&`;
    }

    return query;
  }
}

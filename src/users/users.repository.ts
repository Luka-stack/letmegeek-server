import { InternalServerErrorException } from '@nestjs/common';
import {
  DeleteResult,
  EntityRepository,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

import User from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  async getUsers(filterDto: UserFilterDto): Promise<Array<User>> {
    try {
      return await this.createFilterQuery(filterDto)
        .offset((filterDto.page - 1) * filterDto.limit)
        .limit(filterDto.limit)
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getUserByUsername(username: string): Promise<User> {
    const query = this.createQueryBuilder('user').where(
      'LOWER(user.username) = :username',
      { username: username.toLowerCase() },
    );

    try {
      return await query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getUserFromValidConfirmationToken(token: string): Promise<User> {
    const query = this.createQueryBuilder('user');

    query.where('user.confirmationToken = :token', { token });
    query.andWhere("DATE_PART('day', user.createdAt - NOW()::date) = 0");

    try {
      return await query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async deleteNotConfirmedUsers(): Promise<DeleteResult> {
    const query = this.createQueryBuilder()
      .delete()
      .from(User)
      .where('enabled = false')
      .andWhere("DATE_PART('day', createdAt - NOW()::date) < 0");

    try {
      return await query.execute();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getFilterCount(filterDto: UserFilterDto): Promise<number> {
    try {
      return await this.createFilterQuery(filterDto).getCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  createFilterQuery(filterDto: UserFilterDto): SelectQueryBuilder<User> {
    const { username, order, isBlocked } = filterDto;
    const query = this.createQueryBuilder('user');
    query.where('1=1');

    if (username) {
      query.andWhere('LOWER(user.username) LIKE :username', {
        username: username.toLowerCase(),
      });
    }

    if (isBlocked) {
      query.andWhere('user.blocked = :blocked', { blocked: isBlocked });
    }

    const ordering =
      order.toLowerCase() === 'ASC' || order.toLowerCase() === 'ASCENDING'
        ? 'ASC'
        : 'DESC';
    query.orderBy('user.createdAt', ordering);

    return query;
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { DeleteResult, EntityRepository, In, Repository } from 'typeorm';

import User from './entities/user.entity';
import { UserFilterDto } from './dto/user-filter.dto';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  async getUsers(userFilterDto: UserFilterDto): Promise<Array<User>> {
    const { username } = userFilterDto;
    const query = this.createQueryBuilder('user');

    if (username) {
      query.andWhere('LOWER(user.username) LIKE :username', {
        username: username.toLowerCase(),
      });
    }

    try {
      return await query.getMany();
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
}

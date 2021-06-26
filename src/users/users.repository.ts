import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import User from './entities/user.entity';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  async getUsers(username: string): Promise<Array<User>> {
    const query = this.createQueryBuilder('user');

    if (username) {
      query.andWhere('LOWER(user.username) LIKE :username', { username });
    }

    try {
      const users = await query.getMany();
      return users;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

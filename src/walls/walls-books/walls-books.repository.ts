import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import WallsBook from './entities/walls-book.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import User from 'src/users/entities/user.entity';

@EntityRepository(WallsBook)
export class WallsBooksRepository extends Repository<WallsBook> {
  async getRecords(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsBook>> {
    const { status } = filterDto;
    const query = this.createQueryBuilder('w');

    query.where('LOWER(w.username) = :username', {
      username: `${username.toLowerCase()}`,
    });

    if (status) {
      query.andWhere('LOWER(w.status) = :status', {
        status: `${status.toLowerCase()}`,
      });
    }

    query.leftJoinAndSelect('w.book', 'book');

    try {
      const result = query.getMany();
      return result;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findUserRecordByBook(
    identifier: string,
    username: string,
  ): Promise<WallsBook> {
    const query = this.createQueryBuilder('wallsBook')
      .innerJoin('wallsBook.book', 'book')
      .where('username = :username', { username })
      .andWhere('book.identifier = :identifier', { identifier });

    try {
      return query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

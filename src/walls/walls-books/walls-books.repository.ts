import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import WallsBook from './entities/walls-book.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';

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
}

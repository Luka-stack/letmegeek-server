import { EntityRepository, Repository } from 'typeorm';

import WallsComic from './entities/walls-comic.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { InternalServerErrorException } from '@nestjs/common';

@EntityRepository(WallsComic)
export class WallsComicsRepository extends Repository<WallsComic> {
  async getRecords(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsComic>> {
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

    query.leftJoinAndSelect('w.comic', 'comic');

    try {
      const result = query.getMany();
      return result;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

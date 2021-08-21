import { EntityRepository, Repository } from 'typeorm';

import WallsComic from './entities/walls-comic.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { InternalServerErrorException } from '@nestjs/common';
import Comic from 'src/comics/entities/comic.entity';

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

  async findUserRecordByComic(
    identifier: string,
    username: string,
  ): Promise<WallsComic> {
    const query = this.createQueryBuilder('wallsComic')
      .innerJoin('wallsComic.comic', 'comic')
      .where('username = :username', { username })
      .andWhere('comic.identifier = :identifier', { identifier });

    try {
      return query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async checkUserHasStatusesOnComic(
    username: string,
    comic: Comic,
    statuses: Array<string>,
  ): Promise<boolean> {
    try {
      const recordCount = await this.createQueryBuilder('wallsComic')
        .where('username = :username', { username })
        .andWhere('"comicId" = :comic', { comic: comic.id })
        .andWhere('status IN (:...statuses)', { statuses })
        .limit(1)
        .getCount();

      return recordCount > 0;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  // async getUsersStats(username: string): Promise<Array<any>> {
  //   try {
  //     return await this.createQueryBuilder('wallsComics')
  //       .select('AVG(wallsComics.score)', 'meanScore')
  //       .addSelect('COUNT(wallsComics.id)', 'count')
  //       .addSelect('wallsComics.status', 'status')
  //       .where('username = :username', { username })
  //       .groupBy('wallsComics.status')
  //       .getRawMany();
  //   } catch (err) {
  //     console.log(err);
  //     throw new InternalServerErrorException();
  //   }
  // }
}

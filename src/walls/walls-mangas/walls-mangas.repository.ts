import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

import Manga from '../../mangas/entities/manga.entity';
import WallsManga from './entities/walls-manga.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';

@EntityRepository(WallsManga)
export class WallsMangasRepository extends Repository<WallsManga> {
  async getRecords(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsManga>> {
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

    query.leftJoinAndSelect('w.manga', 'manga');

    try {
      const result = query.getMany();
      return result;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findUserRecordByManga(
    identifier: string,
    username: string,
  ): Promise<WallsManga> {
    const query = this.createQueryBuilder('wallsManga')
      .innerJoin('wallsManga.manga', 'manga')
      .where('username = :username', { username })
      .andWhere('manga.identifier = :identifier', { identifier });

    try {
      return query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async checkUserHasStatusesOnManga(
    username: string,
    manga: Manga,
    statuses: Array<string>,
  ): Promise<boolean> {
    try {
      const recordCount = await this.createQueryBuilder('wallsManga')
        .where('username = :username', { username })
        .andWhere('"mangaId" = :manga', { manga: manga.id })
        .andWhere('status IN (:...statuses)', { statuses })
        .limit(1)
        .getCount();

      return recordCount > 0;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

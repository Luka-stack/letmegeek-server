import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

import WallsGame from './entities/walls-game.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';

@EntityRepository(WallsGame)
export class WallsGamesRepository extends Repository<WallsGame> {
  async getRecords(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsGame>> {
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

    query.leftJoinAndSelect('w.game', 'game');

    try {
      const result = query.getMany();
      return result;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

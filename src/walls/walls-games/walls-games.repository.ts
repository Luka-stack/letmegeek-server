import { EntityRepository, Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';

import WallsGame from './entities/walls-game.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import Game from 'src/articles/games/entities/game.entity';

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

  async findUserRecordByGame(
    identifier: string,
    username: string,
  ): Promise<WallsGame> {
    const query = this.createQueryBuilder('wallsGame')
      .innerJoin('wallsGame.game', 'game')
      .where('username = :username', { username })
      .andWhere('game.identifier = :identifier', { identifier });

    try {
      return query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async checkUserHasStatusesOnGame(
    username: string,
    game: Game,
    statuses: Array<string>,
  ): Promise<boolean> {
    try {
      const recordCount = await this.createQueryBuilder('wallsGame')
        .where('username = :username', { username })
        .andWhere('"gameId" = :game', { game: game.id })
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
  //     return await this.createQueryBuilder('wallsGames')
  //       .select('AVG(wallsGames.score)', 'meanScore')
  //       .addSelect('COUNT(wallsGames.id)', 'count')
  //       .addSelect('wallsGames.status', 'status')
  //       .where('username = :username', { username })
  //       .groupBy('wallsGames.status')
  //       .getRawMany();
  //   } catch (err) {
  //     console.log(err);
  //     throw new InternalServerErrorException();
  //   }
  // }
}

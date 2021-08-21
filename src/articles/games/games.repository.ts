import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';

import Game from './entities/game.entity';
import GameStats from './entities/game-stats.viewentity';
import WallsGame from '../../walls/walls-games/entities/walls-game.entity';
import { GamesFilterDto } from './dto/games-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../../utils/helpers';

@EntityRepository(Game)
export class GamesRepository extends Repository<Game> {
  async getGames(
    filterDto: GamesFilterDto,
    username: string,
  ): Promise<Array<any>> {
    const { orderBy, ordering } = filterDto;
    const query = this.createFilterQuery(filterDto).leftJoin(
      GameStats,
      'gameStats',
      'game.id = gameStats.gameId',
    );

    if (username) {
      query
        .leftJoin(
          WallsGame,
          'wallGame',
          'wallGame.username = :username AND wallGame.gameId = game.id',
          {
            username,
          },
        )
        .addSelect('wallGame.score')
        .addSelect('wallGame.status');
    }

    query
      .addSelect('gameStats.members')
      .addSelect('gameStats.avgScore')
      .addSelect('gameStats.countScore');

    if (orderBy) {
      query.orderBy(
        `gameStats.${orderBy} IS NOT NULL`,
        ordering && ordering === 'ASC' ? 'ASC' : 'DESC',
      );
    }

    try {
      return await query
        .offset((filterDto.page - 1) * filterDto.limit)
        .limit(filterDto.limit)
        .getRawMany();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getGame(
    identifier: string,
    slug: string,
    username: string,
  ): Promise<any> {
    const query = this.createQueryBuilder('game');
    query.where('game.identifier = :identifier', { identifier });
    query.andWhere('game.slug = :slug', { slug });

    if (username) {
      query.leftJoinAndSelect(
        WallsGame,
        'wallGame',
        'wallGame.username = :username AND wallGame.gameId = game.id',
        {
          username,
        },
      );
    }

    query
      .leftJoin(GameStats, 'gameStats', 'game.id = gameStats.gameId')
      .addSelect('gameStats.members')
      .addSelect('gameStats.avgScore')
      .addSelect('gameStats.countScore');

    try {
      const game = await query.getRawOne();
      return game;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getFilterCount(filterDto: GamesFilterDto): Promise<number> {
    try {
      return await this.createFilterQuery(filterDto).getCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  createFilterQuery(filterDto: GamesFilterDto): SelectQueryBuilder<Game> {
    const {
      name,
      completeTime,
      gameMode,
      gears,
      genres,
      authors,
      publishers,
      premiered,
    } = filterDto;
    const query = this.createQueryBuilder('game');
    query.where('1=1');

    if (name) {
      query.andWhere('LOWER(game.title) LIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (genres) {
      const [genreQuery, values] = prepareMultipleNestedAndQueryForStringField(
        genres,
        'game.genres',
      );
      query.andWhere(genreQuery, values);
    }

    if (authors) {
      const [authorsQuery, values] =
        prepareMultipleNestedAndQueryForStringField(authors, 'game.authors');
      query.andWhere(authorsQuery, values);
    }

    if (publishers) {
      const [publishersQuery, values] =
        prepareMultipleNestedAndQueryForStringField(
          publishers,
          'game.publishers',
        );
      query.andWhere(publishersQuery, values);
    }

    if (gameMode) {
      const [gameModeQuery, values] =
        prepareMultipleNestedAndQueryForStringField(
          gameMode,
          'game."gameMode"',
        );
      query.andWhere(gameModeQuery, values);
    }

    if (gears) {
      const [gearQuery, values] = prepareMultipleNestedAndQueryForStringField(
        gears,
        'game.gears',
      );
      query.andWhere(gearQuery, values);
    }

    if (completeTime) {
      query.andWhere('game.completeTime <= :completeTime', { completeTime });
    }

    if (premiered) {
      query.andWhere(
        "DATE_PART('year', game.premiered) - DATE_PART('year', :premiered::date) >= 0",
        { premiered: `${premiered}-01-01` },
      );
    }

    return query;
  }
}

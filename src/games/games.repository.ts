import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';

import Game from './entities/game.entity';
import { GamesFilterDto } from './dto/games-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../utils/helpers';
import User from 'src/users/entities/user.entity';

@EntityRepository(Game)
export class GamesRepository extends Repository<Game> {
  async getGames(filterDto: GamesFilterDto): Promise<Array<Game>> {
    try {
      return await this.createFilterQuery(filterDto)
        .leftJoinAndSelect('game.wallsGames', 'WallsGames')
        .offset((filterDto.page - 1) * filterDto.limit)
        .limit(filterDto.limit)
        .getMany();
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

  async getCompleteGame(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<Game> {
    const query = this.createQueryBuilder('game');
    query.where('game.identifier = :identifier', { identifier });
    query.andWhere('game.slug = :slug', { slug });

    if (user) {
      query.leftJoinAndSelect('game.wallsGames', 'WallsGame');
    }

    try {
      return await query.getOne();
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

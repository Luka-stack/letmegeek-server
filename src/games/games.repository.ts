import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import Game from './entities/game.entity';
import { GamesFilterDto } from './dto/games-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../utils/helpers';

@EntityRepository(Game)
export class GamesRepository extends Repository<Game> {
  async getGames(filterDto: GamesFilterDto): Promise<Array<Game>> {
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
          publishers,
          'game."gameMode"',
        );
      query.andWhere(gameModeQuery, values);
    }

    if (gears) {
      const [gearQuery, values] = prepareMultipleNestedAndQueryForStringField(
        publishers,
        'game.gear',
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

    try {
      const mangas = await query.getMany();
      return mangas;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

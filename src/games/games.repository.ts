import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { GamesFilterDto } from './dto/games-filter.dto';

import Game from './entities/game.entity';

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
      let genreQuery = '(';
      const values = {};

      genres.split(',').forEach((genre) => {
        genreQuery += `LOWER(game.genres) LIKE :${genre.toLowerCase()} OR `;
        values[genre.toLowerCase()] = `%${genre.toLowerCase()}%`;
      });
      genreQuery = genreQuery.slice(0, -3) + ')';

      query.andWhere(genreQuery, values);
    }

    if (authors) {
      let authorQuery = '(';
      const values = {};

      genres.split(',').forEach((author) => {
        authorQuery += `LOWER(game.authors) LIKE :${author.toLowerCase()} OR `;
        values[author.toLowerCase()] = `%${author.toLowerCase()}%`;
      });
      authorQuery = authorQuery.slice(0, -3) + ')';

      query.andWhere(authorQuery, values);
    }

    if (publishers) {
      let publisherQuery = '(';
      const values = {};

      genres.split(',').forEach((publisher) => {
        publisherQuery += `LOWER(game.publishers) LIKE :${publisher.toLowerCase()} OR `;
        values[publisher.toLowerCase()] = `%${publisher.toLowerCase()}%`;
      });
      publisherQuery = publisherQuery.slice(0, -3) + ')';

      query.andWhere(publisherQuery, values);
    }

    if (gameMode) {
      let gameModeQuery = '(';
      const values = {};

      genres.split(',').forEach((mode) => {
        gameModeQuery += `LOWER(game."gameMode") LIKE :${mode.toLowerCase()} OR `;
        values[mode.toLowerCase()] = `%${mode.toLowerCase()}%`;
      });
      gameModeQuery = gameModeQuery.slice(0, -3) + ')';

      query.andWhere(gameModeQuery, values);
    }

    if (gears) {
      let gearQuery = '(';
      const values = {};

      genres.split(',').forEach((gear) => {
        gearQuery += `LOWER(game.gear) LIKE :${gear.toLowerCase()} OR `;
        values[gear.toLowerCase()] = `%${gear.toLowerCase()}%`;
      });
      gearQuery = gearQuery.slice(0, -3) + ')';

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

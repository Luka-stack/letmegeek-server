import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { ComicsFilterDto } from './dto/comics-filter.dto';

import Comic from './entities/comic.entity';

@EntityRepository(Comic)
export class ComicsRepository extends Repository<Comic> {
  async getComics(filterDto: ComicsFilterDto): Promise<Array<Comic>> {
    const { name, issues, finished, genres, authors, publishers, premiered } =
      filterDto;
    const query = this.createQueryBuilder('comic');
    query.where('1=1');

    if (name) {
      query.andWhere('LOWER(comic.title) LIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (genres) {
      let genreQuery = '(';
      const values = {};

      genres.split(',').forEach((genre) => {
        genreQuery += `LOWER(comic.genres) LIKE :${genre.toLowerCase()} OR `;
        values[genre.toLowerCase()] = `%${genre.toLowerCase()}%`;
      });
      genreQuery = genreQuery.slice(0, -3) + ')';

      query.andWhere(genreQuery, values);
    }

    if (authors) {
      query.andWhere('LOWER(comic.authors) LIKE :author', {
        author: `%${authors.toLowerCase()}%`,
      });
    }

    if (publishers) {
      query.andWhere('LOWER(comic.publishers) LIKE :publisher', {
        publisher: `%${publishers.toLowerCase()}%`,
      });
    }

    if (issues) {
      query.andWhere('comic.issues <= :issues', { issues });
    }

    if (finished) {
      query.andWhere('comic.finished IS NOT NULL');
    }

    if (premiered) {
      query.andWhere(
        "DATE_PART('year', comic.premiered) - DATE_PART('year', :premiered::date) >= 0",
        { premiered: `${premiered}-01-01` },
      );
    }

    try {
      const comics = await query.getMany();
      return comics;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

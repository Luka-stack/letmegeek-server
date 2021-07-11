import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import User from '../users/entities/user.entity';
import Comic from './entities/comic.entity';
import { ComicsFilterDto } from './dto/comics-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../utils/helpers';

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
      const [genreQuery, values] = prepareMultipleNestedAndQueryForStringField(
        genres,
        'comic.genres',
      );
      query.andWhere(genreQuery, values);
    }

    if (authors) {
      const [authorsQuery, values] =
        prepareMultipleNestedAndQueryForStringField(authors, 'comic.authors');
      query.andWhere(authorsQuery, values);
    }

    if (publishers) {
      const [publishersQuery, values] =
        prepareMultipleNestedAndQueryForStringField(
          publishers,
          'comic.publishers',
        );
      query.andWhere(publishersQuery, values);
    }

    if (issues) {
      query.andWhere('comic.issues <= :issues', { issues });
    }

    if (finished == 'true') {
      query.andWhere('comic.finished IS NOT NULL');
    }

    if (premiered) {
      query.andWhere(
        "DATE_PART('year', comic.premiered) - DATE_PART('year', :premiered::date) >= 0",
        { premiered: `${premiered}-01-01` },
      );
    }

    query.leftJoinAndSelect('comic.wallsComics', 'WallsComic');

    try {
      const comics = await query.getMany();
      return comics;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getCompleteComic(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<Comic> {
    const query = this.createQueryBuilder('comic');
    query.where('comic.identifier = :identifier', { identifier });
    query.andWhere('comic.slug = :slug', { slug });

    if (user) {
      query.leftJoinAndSelect('comic.wallsComics', 'WallsComic');
    }

    try {
      const comic = await query.getOne();
      return comic;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';

import Comic from './entities/comic.entity';
import ComicStats from './entities/comic-stats.viewentity';
import WallsComic from '../../walls/walls-comics/entities/walls-comic.entity';
import { ComicsFilterDto } from './dto/comics-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../../utils/helpers';

@EntityRepository(Comic)
export class ComicsRepository extends Repository<Comic> {
  async getComics(
    filterDto: ComicsFilterDto,
    username: string,
  ): Promise<Array<any>> {
    const { orderBy, ordering } = filterDto;
    const query = this.createFilterQuery(filterDto)
      .addSelect(
        `COALESCE(NULLIF(comic.imageUrn, '${process.env.APP_URL}/images/comic.imageUrn'), 'https://via.placeholder.com/225x320')`,
        'comic_imageUrl',
      )
      .leftJoin(ComicStats, 'comicStats', 'comic.id = comicStats.comicId');

    if (username) {
      query
        .leftJoin(
          WallsComic,
          'wallComic',
          'wallComic.username = :username AND wallComic.comicId = comic.id',
          {
            username,
          },
        )
        .addSelect('wallComic.score')
        .addSelect('wallComic.status');
    }

    query
      .addSelect('comicStats.members')
      .addSelect('comicStats.avgScore')
      .addSelect('comicStats.countScore');

    if (orderBy) {
      query.orderBy(
        `comicStats.${orderBy} IS NOT NULL`,
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

  async getComic(
    identifier: string,
    slug: string,
    username: string,
  ): Promise<any> {
    const query = this.createQueryBuilder('comic');
    query.where('comic.identifier = :identifier', { identifier });
    query.andWhere('comic.slug = :slug', { slug });

    if (username) {
      query.leftJoinAndSelect(
        WallsComic,
        'wallComic',
        'wallComic.username = :username AND wallComic.comicId = comic.id',
        {
          username,
        },
      );
    }

    query
      .leftJoin(ComicStats, 'comicStats', 'comic.id = comicStats.comicId')
      .addSelect('comicStats.members')
      .addSelect('comicStats.avgScore')
      .addSelect('comicStats.countScore');

    try {
      const comic = await query.getRawOne();
      return comic;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getFilterCount(filterDto: ComicsFilterDto): Promise<number> {
    try {
      return await this.createFilterQuery(filterDto).getCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  createFilterQuery(filterDto: ComicsFilterDto): SelectQueryBuilder<Comic> {
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

    return query;
  }
}

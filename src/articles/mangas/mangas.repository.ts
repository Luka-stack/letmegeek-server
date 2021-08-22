import { InternalServerErrorException } from '@nestjs/common/exceptions';
import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';

import Manga from './entities/manga.entity';
import MangaStats from './entities/manga-stats.viewentity';
import WallsManga from '../../walls/walls-mangas/entities/walls-manga.entity';
import { MangasFilterDto } from './dto/mangas-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../../utils/helpers';

@EntityRepository(Manga)
export class MangasRepository extends Repository<Manga> {
  async getMangas(
    filterDto: MangasFilterDto,
    username: string,
  ): Promise<Array<any>> {
    const { orderBy, ordering } = filterDto;
    const query = this.createFilterQuery(filterDto)
      .addSelect(
        `COALESCE(NULLIF(manga.imageUrn, '${process.env.APP_URL}/images/manga.imageUrn'), 'https://via.placeholder.com/225x320')`,
        'manga_imageUrl',
      )
      .leftJoin(MangaStats, 'mangaStats', 'manga.id = mangaStats.mangaId');

    if (username) {
      query
        .leftJoin(
          WallsManga,
          'wallManga',
          'wallManga.username = :username AND wallManga.mangaId = manga.id',
          {
            username,
          },
        )
        .addSelect('wallManga.score')
        .addSelect('wallManga.status');
    }

    query
      .addSelect('mangaStats.members')
      .addSelect('mangaStats.avgScore')
      .addSelect('mangaStats.countScore');

    if (orderBy) {
      query.orderBy(
        `mangaStats.${orderBy} IS NOT NULL`,
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

  async getManga(
    identifier: string,
    slug: string,
    username: string,
  ): Promise<any> {
    const query = this.createQueryBuilder('manga');
    query.where('manga.identifier = :identifier', { identifier });
    query.andWhere('manga.slug = :slug', { slug });

    if (username) {
      query.leftJoinAndSelect(
        WallsManga,
        'wallManga',
        'wallManga.username = :username AND wallManga.mangaId = manga.id',
        {
          username,
        },
      );
    }

    query
      .leftJoin(MangaStats, 'mangaStats', 'manga.id = mangaStats.mangaId')
      .addSelect('mangaStats.members')
      .addSelect('mangaStats.avgScore')
      .addSelect('mangaStats.countScore');

    try {
      const manga = await query.getRawOne();
      return manga;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getFilterCount(filterDto: MangasFilterDto): Promise<number> {
    try {
      return await this.createFilterQuery(filterDto).getCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  createFilterQuery(filterDto: MangasFilterDto): SelectQueryBuilder<Manga> {
    const {
      name,
      volumes,
      finished,
      genres,
      authors,
      publishers,
      premiered,
      type,
    } = filterDto;
    const query = this.createQueryBuilder('manga');
    query.where('1=1');

    if (name) {
      query.andWhere('LOWER(manga.title) LIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (type) {
      query.andWhere('LOWER(manga.type) LIKE :type', {
        type: type.toLowerCase(),
      });
    }

    if (genres) {
      const [genreQuery, values] = prepareMultipleNestedAndQueryForStringField(
        genres,
        'manga.genres',
      );
      query.andWhere(genreQuery, values);
    }

    if (authors) {
      const [authorsQuery, values] =
        prepareMultipleNestedAndQueryForStringField(authors, 'manga.authors');
      query.andWhere(authorsQuery, values);
    }

    if (publishers) {
      const [publishersQuery, values] =
        prepareMultipleNestedAndQueryForStringField(
          publishers,
          'manga.publishers',
        );
      query.andWhere(publishersQuery, values);
    }

    if (volumes) {
      query.andWhere('manga.volumes <= :volumes', { volumes });
    }

    if (finished == 'true') {
      query.andWhere('manga.finished IS NOT NULL');
    }

    if (premiered) {
      query.andWhere(
        "DATE_PART('year', manga.premiered) - DATE_PART('year', :premiered::date) = 0",
        { premiered: `${premiered}-01-01` },
      );
    }

    return query;
  }
}

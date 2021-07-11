import { InternalServerErrorException } from '@nestjs/common/exceptions';
import { EntityRepository, Repository } from 'typeorm';

import User from '../users/entities/user.entity';
import Manga from './entities/manga.entity';
import { MangasFilterDto } from './dto/mangas-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../utils/helpers';

@EntityRepository(Manga)
export class MangasRepository extends Repository<Manga> {
  async getMangas(filterDto: MangasFilterDto): Promise<Array<Manga>> {
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

    query.leftJoinAndSelect('manga.wallsMangas', 'WallsManga');

    try {
      const mangas = await query.getMany();
      return mangas;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getCompleteManga(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<Manga> {
    const query = this.createQueryBuilder('manga');
    query.where('manga.identifier = :identifier', { identifier });
    query.andWhere('manga.slug = :slug', { slug });

    if (user) {
      query.leftJoinAndSelect('manga.wallsMangas', 'WallsManga');
    }

    try {
      return await query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

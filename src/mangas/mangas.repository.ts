import { InternalServerErrorException } from '@nestjs/common/exceptions';
import { EntityRepository, Repository } from 'typeorm';

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
        type: name.toLowerCase(),
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

    if (finished) {
      query.andWhere('manga.finished IS NOT NULL');
    }

    if (premiered) {
      query.andWhere(
        "DATE_PART('year', manga.premiered) - DATE_PART('year', :premiered::date) >= 0",
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

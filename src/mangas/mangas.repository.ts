import { InternalServerErrorException } from '@nestjs/common/exceptions';
import { EntityRepository, Repository } from 'typeorm';

import Manga from './entities/manga.entity';
import { MangasFilterDto } from './dto/mangas-filter.dto';

@EntityRepository(Manga)
export class MangasRepository extends Repository<Manga> {
  async getMangas(filterDto: MangasFilterDto): Promise<Array<Manga>> {
    const { name, volumes, finished, genres, authors, publishers, premiered } =
      filterDto;
    const query = this.createQueryBuilder('manga');
    query.where('1=1');

    if (name) {
      query.andWhere('LOWER(manga.title) LIKE :name', {
        name: `%${name.toLowerCase()}%`,
      });
    }

    if (genres) {
      let genreQuery = '(';
      const values = {};

      genres.split(',').forEach((genre) => {
        genreQuery += `LOWER(manga.genres) LIKE :${genre.toLowerCase()} OR `;
        values[genre.toLowerCase()] = `%${genre.toLowerCase()}%`;
      });
      genreQuery = genreQuery.slice(0, -3) + ')';

      query.andWhere(genreQuery, values);
    }

    if (authors) {
      let authorQuery = '(';
      const values = {};

      genres.split(',').forEach((author) => {
        authorQuery += `LOWER(manga.authors) LIKE :${author.toLowerCase()} OR `;
        values[author.toLowerCase()] = `%${author.toLowerCase()}%`;
      });
      authorQuery = authorQuery.slice(0, -3) + ')';

      query.andWhere(authorQuery, values);
    }

    if (publishers) {
      let publisherQuery = '(';
      const values = {};

      genres.split(',').forEach((publisher) => {
        publisherQuery += `LOWER(manga.publishers) LIKE :${publisher.toLowerCase()} OR `;
        values[publisher.toLowerCase()] = `%${publisher.toLowerCase()}%`;
      });
      publisherQuery = publisherQuery.slice(0, -3) + ')';

      query.andWhere(publisherQuery, values);
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

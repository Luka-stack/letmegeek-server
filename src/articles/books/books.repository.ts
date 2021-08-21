import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';

import Book from './entities/book.entity';
import BookStats from './entities/book-stats.viewentity';
import WallsBook from '../../walls/walls-books/entities/walls-book.entity';
import { BooksFilterDto } from './dto/books-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../../utils/helpers';

@EntityRepository(Book)
export class BooksRepository extends Repository<Book> {
  async getBooks(
    filterDto: BooksFilterDto,
    username: string,
  ): Promise<Array<any>> {
    const { orderBy, ordering } = filterDto;
    const query = this.createFilterQuery(filterDto).leftJoin(
      BookStats,
      'bookStats',
      'book.id = bookStats.bookId',
    );

    if (username) {
      query
        .leftJoin(
          WallsBook,
          'wallBook',
          'wallBook.username = :username AND wallBook.bookId = book.id',
          {
            username,
          },
        )
        .addSelect('wallBook.score')
        .addSelect('wallBook.status');
    }

    query
      .addSelect('bookStats.members')
      .addSelect('bookStats.avgScore')
      .addSelect('bookStats.countScore');

    if (orderBy) {
      query.orderBy(
        `bookStats.${orderBy} IS NOT NULL`,
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

  async getBook(
    identifier: string,
    slug: string,
    username: string,
  ): Promise<any> {
    const query = this.createQueryBuilder('book');
    query.where('book.identifier = :identifier', { identifier });
    query.andWhere('book.slug = :slug', { slug });

    if (username) {
      query.leftJoinAndSelect(
        WallsBook,
        'wallBook',
        'wallBook.username = :username AND wallBook.bookId = book.id',
        {
          username,
        },
      );
    }

    query
      .leftJoin(BookStats, 'bookStats', 'book.id = bookStats.bookId')
      .addSelect('bookStats.members')
      .addSelect('bookStats.avgScore')
      .addSelect('bookStats.countScore');

    try {
      const book = await query.getRawOne();
      return book;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getFilterCount(filterDto: BooksFilterDto): Promise<number> {
    try {
      return await this.createFilterQuery(filterDto).getCount();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  createFilterQuery(filterDto: BooksFilterDto): SelectQueryBuilder<Book> {
    const { name, genres, authors, publishers, pages, premiered } = filterDto;
    const query = this.createQueryBuilder('book');
    query.where('1=1');

    if (name) {
      query.andWhere(
        '(LOWER(book.series) LIKE :name OR LOWER(book.title) LIKE :name)',
        {
          name: `%${name.toLowerCase()}%`,
        },
      );
    }

    if (genres) {
      const [genreQuery, values] = prepareMultipleNestedAndQueryForStringField(
        genres,
        'book.genres',
      );
      query.andWhere(genreQuery, values);
    }

    if (authors) {
      const [authorsQuery, values] =
        prepareMultipleNestedAndQueryForStringField(authors, 'book.authors');
      query.andWhere(authorsQuery, values);
    }

    if (publishers) {
      const [publishersQuery, values] =
        prepareMultipleNestedAndQueryForStringField(
          publishers,
          'book.publishers',
        );
      query.andWhere(publishersQuery, values);
    }

    if (pages) {
      query.andWhere('book.pages <= :pages', { pages });
    }

    if (premiered) {
      query.andWhere(
        "DATE_PART('year', manga.premiered) - DATE_PART('year', :premiered::date) >= 0",
        { premiered: `${premiered}-01-01` },
      );
    }

    return query;
  }
}

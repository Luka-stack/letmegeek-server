import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import Book from './entities/book.entity';
import User from 'src/users/entities/user.entity';
import { BooksFilterDto } from './dto/books-filter.dto';
import { prepareMultipleNestedAndQueryForStringField } from '../utils/helpers';

@EntityRepository(Book)
export class BooksRepository extends Repository<Book> {
  async getBooks(filterDto: BooksFilterDto): Promise<Array<Book>> {
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

    query.leftJoinAndSelect('book.wallsBooks', 'WallsBook');

    try {
      const books = await query.getMany();
      return books;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async getCompleteBook(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<Book> {
    const query = this.createQueryBuilder('book');
    query.where('book.identifier = :identifier', { identifier });
    query.andWhere('book.slug = :slug', { slug });

    if (user) {
      query.leftJoinAndSelect('book.wallsBooks', 'WallsBook');
    }

    try {
      const book = await query.getOne();
      return book;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

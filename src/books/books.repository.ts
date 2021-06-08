import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import { BooksFilterDto } from './dto/books-filter.dto';
import Book from './entities/book.entity';

@EntityRepository(Book)
export class BooksRepository extends Repository<Book> {
  async getBooks(filterDto: BooksFilterDto): Promise<Array<Book>> {
    const { name, genres, author, publisher, pages } = filterDto;
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
      let genreQuery = '(';
      const values = {};

      genres.split(',').forEach((genre) => {
        genreQuery += `LOWER(book.genres) LIKE :${genre.toLowerCase()} OR `;
        values[genre.toLowerCase()] = `%${genre.toLowerCase()}%`;
      });
      genreQuery = genreQuery.slice(0, -3) + ')';

      query.andWhere(genreQuery, values);
    }

    if (author) {
      query.andWhere('LOWER(book.authors) LIKE :author', {
        author: `%${author.toLowerCase()}%`,
      });
    }

    if (publisher) {
      query.andWhere('LOWER(book.publishers) LIKE :publisher', {
        publisher: `%${publisher.toLowerCase()}%`,
      });
    }

    if (pages) {
      query.andWhere('pages <= :pages', { pages });
    }

    try {
      const books = await query.getMany();
      return books;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

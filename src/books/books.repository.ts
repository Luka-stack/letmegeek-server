import { EntityRepository, Repository } from 'typeorm';

import { CreateBookDto } from './dto/create-book.dto';
import Book from './entities/book.entity';

@EntityRepository(Book)
export class BooksRepository extends Repository<Book> {
  async createBook(createBookDto: CreateBookDto): Promise<Book> {
    const book = this.create({
      title: createBookDto.title,
      series: createBookDto.series,
      author: createBookDto.author,
      description: createBookDto.description,
      publisher: createBookDto.publisher,
      premiered: createBookDto.premiered,
      draft: createBookDto.draft,
    });

    await this.save(book);
    return book;
  }
}

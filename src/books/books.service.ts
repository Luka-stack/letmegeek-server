import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Book from './entities/book.entity';
import { BookDto } from './dto/book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BooksRepository } from './books.repository';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksFilterDto } from './dto/books-filter.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,
  ) {}

  async createBook(bookDto: BookDto): Promise<Book> {
    const book = this.booksRepository.create(bookDto);
    book.createdAt = new Date();

    await this.booksRepository.save(book).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return book;
  }

  getBooks(filterDto: BooksFilterDto): Promise<Array<Book>> {
    return this.booksRepository.getBooks(filterDto);
    // return this.booksRepository.getBooks(filterDto);
  }

  async updateBook(
    identifier: string,
    slug: string,
    updateBookDto: UpdateBookDto,
  ): Promise<Book | undefined> {
    const book = await this.booksRepository.findOne({ identifier, slug });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    book.updateFields(updateBookDto);
    if (updateBookDto.draft != null && updateBookDto.draft) {
      book.createdAt = new Date();
    }

    await this.booksRepository.save(book).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return book;
  }

  async deleteBook(identifier: string, slug: string): Promise<void> {
    const result = await this.booksRepository.delete({ identifier, slug });

    if (result.affected === 0) {
      throw new NotFoundException('Book not found');
    }
  }
}

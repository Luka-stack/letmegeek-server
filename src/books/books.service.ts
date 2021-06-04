import { Injectable, NotFoundException } from '@nestjs/common';

import Book from './entities/book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BooksRepository } from './books.repository';
import { UpdateBookDto } from './dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,
  ) {}

  createBook(createBookDto: CreateBookDto): Promise<Book> {
    return this.booksRepository.createBook(createBookDto);
  }

  async getBooks(): Promise<Array<Book>> {
    return this.booksRepository.find();
  }

  async updateBook(
    identifier: string,
    updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    const book = await this.booksRepository.findOne({ identifier });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    book.title = updateBookDto.title || book.title;
    book.series = updateBookDto.series || book.series;
    book.author = updateBookDto.author || book.author;
    book.description = updateBookDto.description || book.description;
    book.publisher = updateBookDto.publisher || book.publisher;
    book.premiered = updateBookDto.premiered || book.premiered;
    book.draft = updateBookDto.draft || book.draft;

    await this.booksRepository.save(book);

    return book;
  }

  async deleteBook(identifier: string): Promise<void> {
    const result = await this.booksRepository.delete({ identifier });

    if (result.affected === 0) {
      throw new NotFoundException('Book not found');
    }
  }
}

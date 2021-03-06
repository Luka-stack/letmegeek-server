import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import Book from './entities/book.entity';
import User from '../users/entities/user.entity';
import { BookDto } from './dto/book.dto';
import { UserRole } from '../auth/entities/user-role';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksFilterDto } from './dto/books-filter.dto';
import { BooksRepository } from './books.repository';
import { removeSpacesFromCommaSeparatedString } from '../utils/helpers';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,
  ) {}

  async createBook(bookDto: BookDto, user: User): Promise<Book> {
    if (user.role === UserRole.USER) {
      bookDto.draft = true;
    }

    if (bookDto.authors) {
      bookDto.authors = removeSpacesFromCommaSeparatedString(bookDto.authors);
    }

    if (bookDto.publishers) {
      bookDto.publishers = removeSpacesFromCommaSeparatedString(
        bookDto.publishers,
      );
    }

    if (bookDto.genres) {
      bookDto.genres = removeSpacesFromCommaSeparatedString(bookDto.genres);
    }

    const book = this.booksRepository.create(bookDto);
    book.createdAt = new Date();

    await this.booksRepository.save(book).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return book;
  }

  async getBooks(filterDto: BooksFilterDto, user: User): Promise<Array<Book>> {
    const books = await this.booksRepository
      .getBooks(filterDto)
      .then((result: Array<Book>) => {
        if (user) {
          result.map((book: Book) => {
            const wall = book.wallsBooks.find(
              (wall) => wall.username === user.username,
            );
            book.userWallsBook = wall;
          });
        }

        return result;
      });

    return books;
  }

  async getOneBook(
    identifier: string,
    slug: string,
    user: User,
  ): Promise<Book> {
    const book = await this.booksRepository
      .getCompleteBook(identifier, slug, user)
      .then((result: Book) => {
        if (!result) {
          throw new NotFoundException('Book not found');
        }

        if (user) {
          const wall = result.wallsBooks.find(
            (wall) => wall.username === user.username,
          );
          result.userWallsBook = wall;
        }

        return result;
      });

    return book;
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

    if (updateBookDto.authors) {
      updateBookDto.authors = removeSpacesFromCommaSeparatedString(
        updateBookDto.authors,
      );
    }

    if (updateBookDto.publishers) {
      updateBookDto.publishers = removeSpacesFromCommaSeparatedString(
        updateBookDto.publishers,
      );
    }

    if (updateBookDto.genres) {
      updateBookDto.genres = removeSpacesFromCommaSeparatedString(
        updateBookDto.genres,
      );
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
    // const result = await this.booksRepository.delete({ identifier, slug });

    // if (result.affected === 0) {
    //   throw new NotFoundException('Book not found');
    // }

    await this.booksRepository.delete({ identifier, slug }).then((result) => {
      if (result.affected === 0) {
        throw new NotFoundException('Book not found');
      }
    });
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import Book from './entities/book.entity';
import { BooksService } from './books.service';
import { BookDto } from './dto/book.dto';
import { HttpCode } from '@nestjs/common';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksFilterDto } from './dto/books-filter.dto';

@Controller('api/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  createBook(@Body() bookDto: BookDto): Promise<Book> {
    return this.booksService.createBook(bookDto);
  }

  @Get()
  async getBooks(@Query() filterDto: BooksFilterDto): Promise<Array<Book>> {
    const books = await this.booksService.getBooks(filterDto);
    // console.log(books[0]);

    return books;
  }

  @Patch('/:identifier/:slug')
  updateBook(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    return this.booksService.updateBook(identifier, slug, updateBookDto);
  }

  @Delete('/:identifier/:slug')
  @HttpCode(204)
  deleteBook(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.booksService.deleteBook(identifier, slug);
  }
}

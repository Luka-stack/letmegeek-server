import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import Book from './entities/book.entity';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { HttpCode } from '@nestjs/common';

@Controller('api/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  createBook(@Body() createBookDto: CreateBookDto): Promise<Book> {
    return this.booksService.createBook(createBookDto);
  }

  @Get()
  getBooks(): Promise<Array<Book>> {
    return this.booksService.getBooks();
  }

  @Patch('/:identifier')
  updateBook(
    @Param('identifier') identifier: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    return this.booksService.updateBook(identifier, updateBookDto);
  }

  @Delete('/:identifier')
  @HttpCode(204)
  deleteBook(@Param('identifier') identifier: string): Promise<void> {
    return this.booksService.deleteBook(identifier);
  }
}

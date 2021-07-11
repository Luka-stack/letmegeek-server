import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { HttpCode } from '@nestjs/common';

import Book from './entities/book.entity';
import User from '../users/entities/user.entity';
import { BookDto } from './dto/book.dto';
import { BooksService } from './books.service';
import { UpdateBookDto } from './dto/update-book.dto';
import { BooksFilterDto } from './dto/books-filter.dto';
import { HasRoles } from '../auth/decorators/has-roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../auth/entities/user-role';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  createBook(@Body() bookDto: BookDto, @GetUser() user: User): Promise<Book> {
    return this.booksService.createBook(bookDto, user);
  }

  @Get()
  getBooks(
    @Query() filterDto: BooksFilterDto,
    @GetUser() user: User,
  ): Promise<Array<Book>> {
    return this.booksService.getBooks(filterDto, user);
  }

  @Get('/:identifier/:slug')
  getOneBook(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @GetUser() user: User,
  ): Promise<Book> {
    return this.booksService.getOneBook(identifier, slug, user);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/:identifier/:slug')
  updateBook(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<Book> {
    return this.booksService.updateBook(identifier, slug, updateBookDto);
  }

  @HasRoles(UserRole.ADMIN, UserRole.MODERATOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/:identifier/:slug')
  @HttpCode(204)
  deleteBook(
    @Param('identifier') identifier: string,
    @Param('slug') slug: string,
  ): Promise<void> {
    return this.booksService.deleteBook(identifier, slug);
  }
}

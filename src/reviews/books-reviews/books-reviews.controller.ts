import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import User from '../../users/entities/user.entity';
import BooksReview from './entities/books-review.entity';
import { BooksReviewsService } from './books-reviews.service';
import { BooksReviewDto } from './dto/books-review.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedBooksReviewsDto } from './dto/paginated-books-reviews.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateBooksReviewDto } from './dto/update-books-review.dto';

@Controller('api/booksreviews')
export class BooksReviewsController {
  constructor(private readonly booksReviewsService: BooksReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/book/:identifier')
  createReview(
    @Param('identifier') identifier: string,
    @Body() booksReviewDto: BooksReviewDto,
    @GetUser() user: User,
  ): Promise<BooksReview> {
    return this.booksReviewsService.createReview(
      identifier,
      booksReviewDto,
      user,
    );
  }

  @Get('/book/:identifier')
  getReviewsForBook(
    @Param('identifier') identifier: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedBooksReviewsDto> {
    return this.booksReviewsService.getReviewsForBook(
      identifier,
      paginationDto,
    );
  }

  @Get('/user/:username')
  getReviewsForUser(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedBooksReviewsDto> {
    return this.booksReviewsService.getReviewsForUser(username, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Delete('/:identifier')
  deleteReview(
    @Param('identifier') identifier: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.booksReviewsService.deleteReview(identifier, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:identifier')
  updateReview(
    @Param('identifier') identifier: string,
    @Body() updateDto: UpdateBooksReviewDto,
    @GetUser() user: User,
  ): Promise<BooksReview> {
    return this.booksReviewsService.updateReview(identifier, updateDto, user);
  }
}

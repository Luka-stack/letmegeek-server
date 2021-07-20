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
import ComicsReview from './entities/comics-review.entity';
import { UpdateComicsReviewDto } from './dto/update-comics-review.dto';
import { ComicsReviewDto } from './dto/comics-review.dto';
import { ComicsReviewsService } from './comics-reviews.service';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedComicsReviewsDto } from './dto/paginated-comics-reviews.dto';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/comicsreviews')
export class ComicsReviewsController {
  constructor(private readonly comicsReviewService: ComicsReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/comic/:identifier')
  createReview(
    @Param('identifier') identifier: string,
    @Body() comicsReviewDto: ComicsReviewDto,
    @GetUser() user: User,
  ): Promise<ComicsReview> {
    return this.comicsReviewService.createReview(
      identifier,
      comicsReviewDto,
      user,
    );
  }

  @Get('/comic/:identifier')
  getReviewsForComic(
    @Param('identifier') identifier: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedComicsReviewsDto> {
    return this.comicsReviewService.getReviews(paginationDto, identifier);
  }

  @Get('/user/:username')
  getReviewsForUser(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedComicsReviewsDto> {
    return this.comicsReviewService.getReviews(
      paginationDto,
      undefined,
      username,
    );
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Delete('/:identifier')
  deleteReview(
    @Param('identifier') identifier: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.comicsReviewService.deleteReview(identifier, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:identifier')
  updateReview(
    @Param('identifier') identifier: string,
    @Body() updateDto: UpdateComicsReviewDto,
    @GetUser() user: User,
  ): Promise<ComicsReview> {
    return this.comicsReviewService.updateReview(identifier, updateDto, user);
  }
}

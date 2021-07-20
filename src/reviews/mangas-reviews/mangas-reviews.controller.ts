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
import MangasReview from './entities/mangas-review.entity';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { MangasReviewDto } from './dto/mangas-review.dto';
import { MangasReviewsService } from './mangas-reviews.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginatedMangasReviewsDto } from './dto/paginated-mangas-reviews.dto';
import { UpdateMangasReviewDto } from './dto/update-mangas-review.dto';

@Controller('api/mangasreviews')
export class MangasReviewsController {
  constructor(private readonly mangasReviewsService: MangasReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/manga/:identifier')
  createReview(
    @Param('identifier') identifier: string,
    @Body() mangasReviewDto: MangasReviewDto,
    @GetUser() user: User,
  ): Promise<MangasReview> {
    return this.mangasReviewsService.createReview(
      identifier,
      mangasReviewDto,
      user,
    );
  }

  @Get('/manga/:identifier')
  getReviewsForComic(
    @Param('identifier') identifier: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMangasReviewsDto> {
    return this.mangasReviewsService.getReviews(paginationDto, identifier);
  }

  @Get('/user/:username')
  getReviewsForUser(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedMangasReviewsDto> {
    return this.mangasReviewsService.getReviews(
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
    return this.mangasReviewsService.deleteReview(identifier, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:identifier')
  updateReview(
    @Param('identifier') identifier: string,
    @Body() updateDto: UpdateMangasReviewDto,
    @GetUser() user: User,
  ): Promise<MangasReview> {
    return this.mangasReviewsService.updateReview(identifier, updateDto, user);
  }
}

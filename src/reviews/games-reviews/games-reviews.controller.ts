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
import GamesReview from './entities/games-review.entity';
import { GamesReviewDto } from './dto/games-review.dto';
import { UpdateGamesReviewDto } from './dto/update-games-review.dto';
import { GamesReviewsService } from './games-reviews.service';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedGamesReviewsDto } from './dto/paginated-games.dto';

@Controller('api/gamesreviews')
export class GamesReviewsController {
  constructor(private readonly gamesReviewsService: GamesReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/game/:identifier')
  createReview(
    @Param('identifier') identifier: string,
    @Body() gamesReviewDto: GamesReviewDto,
    @GetUser() user: User,
  ): Promise<GamesReview> {
    return this.gamesReviewsService.createReview(
      identifier,
      gamesReviewDto,
      user,
    );
  }

  @Get('/game/:identifier')
  getReviewsForComic(
    @Param('identifier') identifier: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedGamesReviewsDto> {
    return this.gamesReviewsService.getReviews(paginationDto, identifier);
  }

  @Get('/user/:username')
  getReviewsForUser(
    @Param('username') username: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<PaginatedGamesReviewsDto> {
    return this.gamesReviewsService.getReviews(
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
    return this.gamesReviewsService.deleteReview(identifier, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/:identifier')
  updateReview(
    @Param('identifier') identifier: string,
    @Body() updateDto: UpdateGamesReviewDto,
    @GetUser() user: User,
  ): Promise<GamesReview> {
    return this.gamesReviewsService.updateReview(identifier, updateDto, user);
  }
}

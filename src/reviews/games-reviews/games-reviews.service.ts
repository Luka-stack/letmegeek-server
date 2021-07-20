import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult } from 'typeorm';

import User from '../../users/entities/user.entity';
import GamesReview from './entities/games-review.entity';
import { UserRole } from '../../auth/entities/user-role';
import { GamesReviewDto } from './dto/games-review.dto';
import { UpdateGamesReviewDto } from './dto/update-games-review.dto';
import { GamesRepository } from '../../games/games.repository';
import { GamesReviewsRepository } from './games-reviews.repository';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedGamesReviewsDto } from './dto/paginated-games.dto';

@Injectable()
export class GamesReviewsService {
  constructor(
    @InjectRepository(GamesReviewsRepository)
    private readonly gamesReviewsRepository: GamesReviewsRepository,
    @InjectRepository(GamesRepository)
    private readonly gamesRepository: GamesRepository,
  ) {}

  async createReview(
    identifier: string,
    gamesReviewDto: GamesReviewDto,
    user: User,
  ): Promise<GamesReview> {
    const game = await this.gamesRepository.findOne({ identifier });
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const review = await this.gamesReviewsRepository.findOne({
      username: user.username,
      game,
    });
    if (review) {
      throw new ConflictException('User can review the same article only once');
    }

    const newReview = this.gamesReviewsRepository.create({
      user,
      game,
      ...gamesReviewDto,
    });

    await this.gamesReviewsRepository.save(newReview);
    return newReview;
  }

  async deleteReview(identifier: string, user: User): Promise<void> {
    let result: DeleteResult;
    if (user.role === UserRole.ADMIN) {
      result = await this.gamesReviewsRepository.delete({ identifier });
    } else {
      result = await this.gamesReviewsRepository.delete({
        identifier,
        username: user.username,
      });
    }

    if (result.affected === 0) {
      throw new NotFoundException('Review not found');
    }
  }

  async updateReview(
    identifier: string,
    updateDto: UpdateGamesReviewDto,
    user: User,
  ): Promise<GamesReview> {
    const gamesReview = await this.gamesReviewsRepository.findOne({
      identifier,
      username: user.username,
    });
    if (!gamesReview) {
      throw new NotFoundException('Review not found');
    }

    gamesReview.updateFields(updateDto);
    return await this.gamesReviewsRepository.save(gamesReview);
  }

  async getReviews(
    paginationDto: PaginationDto,
    identifier?: string,
    username?: string,
  ): Promise<PaginatedGamesReviewsDto> {
    const limit = Number(paginationDto.limit);
    const page = Number(paginationDto.page);
    const skippedItems = (page - 1) * limit;

    const totalCount = await this.gamesReviewsRepository.reviewsCount(
      identifier,
      username,
    );

    let reviews: Array<GamesReview>;
    let nextPage = 'http://localhost:5000/api/gamesreviews/';
    let prevPage = 'http://localhost:5000/api/gamesreviews/';
    if (identifier) {
      reviews = await this.gamesReviewsRepository.getReviewsForGame(
        identifier,
        skippedItems,
        limit,
      );
      nextPage += `game/${identifier}`;
      prevPage += `game/${identifier}`;
    } else {
      reviews = await this.gamesReviewsRepository.getReviewsForUser(
        username,
        skippedItems,
        limit,
      );
      nextPage += `user/${username}`;
      prevPage += `user/${username}`;
    }

    nextPage += `?page=${page + 1}&limit=${limit}`;
    prevPage += `?page=${page - 1}&limit=${limit}`;

    return {
      totalCount,
      page,
      limit,
      data: reviews,
      nextPage: page * limit < totalCount ? nextPage : '',
      prevPage: page >= 2 ? prevPage : '',
    };
  }
}

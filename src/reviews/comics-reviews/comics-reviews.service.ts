import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import User from '../../users/entities/user.entity';
import ComicsReview from './entities/comics-review.entity';
import { ComicsReviewDto } from './dto/comics-review.dto';
import { UpdateComicsReviewDto } from './dto/update-comics-review.dto';
import { ComicsRepository } from '../../comics/comics.repository';
import { ComicsReviewsRepository } from './comics-reviews.repository';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedComicsReviewsDto } from './dto/paginated-comics-reviews.dto';
import { DeleteResult } from 'typeorm';
import { UserRole } from 'src/auth/entities/user-role';

@Injectable()
export class ComicsReviewsService {
  constructor(
    @InjectRepository(ComicsReviewsRepository)
    private readonly comicsReviewsRepository: ComicsReviewsRepository,
    @InjectRepository(ComicsRepository)
    private readonly comicsRepository: ComicsRepository,
  ) {}

  async createReview(
    identifier: string,
    comicsReviewDto: ComicsReviewDto,
    user: User,
  ): Promise<ComicsReview> {
    const comic = await this.comicsRepository.findOne({ identifier });
    if (!comic) {
      throw new NotFoundException('Comic not found');
    }

    const review = await this.comicsReviewsRepository.findOne({
      username: user.username,
      comic,
    });
    if (review) {
      throw new ConflictException('User can review the same article only once');
    }

    const newReview = this.comicsReviewsRepository.create({
      user,
      comic,
      ...comicsReviewDto,
    });

    await this.comicsReviewsRepository.save(newReview);
    return newReview;
  }

  async deleteReview(identifier: string, user: User): Promise<void> {
    let result: DeleteResult;
    if (user.role === UserRole.ADMIN) {
      result = await this.comicsReviewsRepository.delete({ identifier });
    } else {
      result = await this.comicsReviewsRepository.delete({
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
    updateDto: UpdateComicsReviewDto,
    user: User,
  ): Promise<ComicsReview> {
    const comicsReview = await this.comicsReviewsRepository.findOne({
      identifier,
      username: user.username,
    });
    if (!comicsReview) {
      throw new NotFoundException('Review not found');
    }

    comicsReview.updateFields(updateDto);
    return await this.comicsReviewsRepository.save(comicsReview);
  }

  async getReviews(
    paginationDto: PaginationDto,
    identifier?: string,
    username?: string,
  ): Promise<PaginatedComicsReviewsDto> {
    const limit = Number(paginationDto.limit);
    const page = Number(paginationDto.page);
    const skippedItems = (page - 1) * limit;

    const totalCount = await this.comicsReviewsRepository.reviewsCount(
      identifier,
      username,
    );

    let reviews: Array<ComicsReview>;
    let nextPage = 'http://localhost:5000/api/comicsreviews/';
    let prevPage = 'http://localhost:5000/api/comicsreviews/';
    if (identifier) {
      reviews = await this.comicsReviewsRepository.getReviewsForComic(
        identifier,
        skippedItems,
        limit,
      );
      nextPage += `book/${identifier}`;
      prevPage += `book/${identifier}`;
    } else {
      reviews = await this.comicsReviewsRepository.getReviewsForUser(
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

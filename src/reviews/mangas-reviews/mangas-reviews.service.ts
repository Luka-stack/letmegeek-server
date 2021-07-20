import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import User from '../../users/entities/user.entity';
import MangasReview from './entities/mangas-review.entity';
import { UserRole } from '../../auth/entities/user-role';
import { MangasReviewDto } from './dto/mangas-review.dto';
import { UpdateMangasReviewDto } from './dto/update-mangas-review.dto';
import { MangasRepository } from '../../mangas/mangas.repository';
import { MangasReviewsRepository } from './mangas-reviews.repository';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedMangasReviewsDto } from './dto/paginated-mangas-reviews.dto';

@Injectable()
export class MangasReviewsService {
  constructor(
    @InjectRepository(MangasReviewsRepository)
    private readonly mangasReviewsRepository: MangasReviewsRepository,
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
  ) {}

  async createReview(
    identifier: string,
    mangasReviewDto: MangasReviewDto,
    user: User,
  ): Promise<MangasReview> {
    const manga = await this.mangasRepository.findOne({ identifier });
    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    const review = await this.mangasReviewsRepository.findOne({
      username: user.username,
      manga,
    });
    if (review) {
      throw new ConflictException('User can review the same article only once');
    }

    const newReview = this.mangasReviewsRepository.create({
      user,
      manga,
      ...mangasReviewDto,
    });

    await this.mangasReviewsRepository.save(newReview);
    return newReview;
  }

  async deleteReview(identifier: string, user: User): Promise<void> {
    let result: DeleteResult;
    if (user.role === UserRole.ADMIN) {
      result = await this.mangasReviewsRepository.delete({ identifier });
    } else {
      result = await this.mangasReviewsRepository.delete({
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
    updateDto: UpdateMangasReviewDto,
    user: User,
  ): Promise<MangasReview> {
    const mangasReview = await this.mangasReviewsRepository.findOne({
      identifier,
      username: user.username,
    });
    if (!mangasReview) {
      throw new NotFoundException('Review not found');
    }

    mangasReview.updateFields(updateDto);
    return await this.mangasReviewsRepository.save(mangasReview);
  }

  async getReviews(
    paginationDto: PaginationDto,
    identifier?: string,
    username?: string,
  ): Promise<PaginatedMangasReviewsDto> {
    const limit = Number(paginationDto.limit);
    const page = Number(paginationDto.page);
    const skippedItems = (page - 1) * limit;

    const totalCount = await this.mangasReviewsRepository.reviewsCount(
      identifier,
      username,
    );

    let reviews: Array<MangasReview>;
    let nextPage = 'http://localhost:5000/api/mangasreviews/';
    let prevPage = 'http://localhost:5000/api/mangasreviews/';
    if (identifier) {
      reviews = await this.mangasReviewsRepository.getReviewsForComic(
        identifier,
        skippedItems,
        limit,
      );
      nextPage += `manga/${identifier}`;
      prevPage += `manga/${identifier}`;
    } else {
      reviews = await this.mangasReviewsRepository.getReviewsForUser(
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
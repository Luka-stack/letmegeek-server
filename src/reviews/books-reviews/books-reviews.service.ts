import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import User from '../../users/entities/user.entity';
import BooksReview from './entities/books-review.entity';
import { UserRole } from '../../auth/entities/user-role';
import { BooksReviewDto } from './dto/books-review.dto';
import { WallArticleStatus } from '../../walls/entities/wall-article-status';
import { UpdateBooksReviewDto } from './dto/update-books-review.dto';
import { BooksRepository } from '../../articles/books/books.repository';
import { WallsBooksRepository } from '../../walls/walls-books/walls-books.repository';
import { BooksReviewsRepository } from './books-reviews.repository';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedBooksReviewsDto } from './dto/paginated-books-reviews.dto';

@Injectable()
export class BooksReviewsService {
  constructor(
    @InjectRepository(BooksReviewsRepository)
    private readonly booksReviewsRepository: BooksReviewsRepository,

    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,

    @InjectRepository(WallsBooksRepository)
    private readonly wallsBooksRespitory: WallsBooksRepository,

    private readonly configService: ConfigService,
  ) {}

  async createReview(
    identifier: string,
    booksReviewDto: BooksReviewDto,
    user: User,
  ): Promise<BooksReview> {
    const book = await this.booksRepository.findOne({ identifier });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const hasCorrectStatus = await this.wallsBooksRespitory
      .checkUserHasStatusesOnBook(user.username, book, [
        WallArticleStatus.IN_PROGRESS,
        WallArticleStatus.COMPLETED,
        WallArticleStatus.DROPPED,
      ])
      .catch((err) => console.log(err));
    if (!hasCorrectStatus) {
      throw new ConflictException(
        'To create review Users must have the title on their wall',
      );
    }

    const review = await this.booksReviewsRepository.findOne({
      username: user.username,
      book,
    });
    if (review) {
      throw new ConflictException('User can review the same article only once');
    }

    const newReview = this.booksReviewsRepository.create({
      user,
      book,
      ...booksReviewDto,
    });

    await this.booksReviewsRepository.save(newReview);

    return newReview;
  }

  async updateReview(
    identifier: string,
    updateDto: UpdateBooksReviewDto,
    user: User,
  ): Promise<BooksReview> {
    const booksReview = await this.booksReviewsRepository.findOne({
      identifier,
      username: user.username,
    });
    if (!booksReview) {
      throw new NotFoundException('Review not found');
    }

    booksReview.updateFields(updateDto);
    const response = await this.booksReviewsRepository.save(booksReview);

    return response;
  }

  async deleteReview(identifier: string, user: User): Promise<void> {
    let result: DeleteResult;
    if (user.role === UserRole.ADMIN) {
      result = await this.booksReviewsRepository.delete({ identifier });
    } else {
      result = await this.booksReviewsRepository.delete({
        identifier,
        username: user.username,
      });
    }

    if (result.affected === 0) {
      throw new NotFoundException('Review not found');
    }
  }

  async getReviews(
    paginationDto: PaginationDto,
    identifier?: string,
    username?: string,
  ): Promise<PaginatedBooksReviewsDto> {
    const limit = Number(paginationDto.limit);
    const page = Number(paginationDto.page);
    const skippedItems = (page - 1) * limit;

    const totalCount = await this.booksReviewsRepository.reviewsCount(
      identifier,
      username,
    );

    let reviews: Array<BooksReview>;
    let nextPage = `${this.configService.get('APP_URL')}/api/booksreviews/`;
    let prevPage = `${this.configService.get('APP_URL')}/api/booksreviews/`;
    if (identifier) {
      reviews = await this.booksReviewsRepository.getReviewsForBook(
        identifier,
        skippedItems,
        limit,
      );
      nextPage += `book/${identifier}`;
      prevPage += `book/${identifier}`;
    } else {
      reviews = await this.booksReviewsRepository.getReviewsForUser(
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

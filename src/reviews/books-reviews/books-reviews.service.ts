import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import User from '../../users/entities/user.entity';
import BooksReview from './entities/books-review.entity';
import { BooksReviewDto } from './dto/books-review.dto';
import { BooksRepository } from '../../books/books.repository';
import { BooksReviewsRepository } from './books-reviews.repository';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginatedBooksReviewsDto } from './dto/paginated-books-reviews.dto';
import { UserRole } from '../../auth/entities/user-role';
import { UpdateBooksReviewDto } from './dto/update-books-review.dto';

@Injectable()
export class BooksReviewsService {
  constructor(
    @InjectRepository(BooksReviewsRepository)
    private readonly booksReviewsRepository: BooksReviewsRepository,
    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,
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

  async getReviewsForBook(
    identifier: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedBooksReviewsDto> {
    const limit = Number(paginationDto.limit);
    const page = Number(paginationDto.page);
    const skippedItems = (page - 1) * limit;

    const totalCount = await this.booksReviewsRepository.reviewsCount(
      identifier,
    );

    const reviews = await this.booksReviewsRepository.getReviewsForBook(
      identifier,
      skippedItems,
      limit,
    );

    const nextPage = `http://localhost:5000/api/booksreviews/book/${identifier}?page=${
      page + 1
    }&limit=${limit}`;
    const prevPage = `http://localhost:5000/api/booksreviews/book/${identifier}?page=${
      page - 1
    }&limit=${limit}`;

    return {
      totalCount,
      page,
      limit,
      data: reviews,
      nextPage: page * limit < totalCount ? nextPage : '',
      prevPage: page >= 2 ? prevPage : '',
    };
  }

  async getReviewsForUser(
    username: string,
    paginationDto: PaginationDto,
  ): Promise<PaginatedBooksReviewsDto> {
    const limit = Number(paginationDto.limit);
    const page = Number(paginationDto.page);
    const skippedItems = (page - 1) * limit;

    const totalCount = await this.booksReviewsRepository.reviewsCount(username);

    const reviews = await this.booksReviewsRepository.getReviewsForUser(
      username,
      skippedItems,
      limit,
    );

    const nextPage = `http://localhost:5000/api/booksreviews/user/${username}?page=${
      page + 1
    }&limit=${limit}`;
    const prevPage = `http://localhost:5000/api/booksreviews/user/${username}?page=${
      page - 1
    }&limit=${limit}`;

    return {
      totalCount,
      page,
      limit,
      data: reviews,
      nextPage: page * limit < totalCount ? nextPage : '',
      prevPage: page >= 2 ? prevPage : '',
    };
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
}

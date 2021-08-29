import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import BooksReview from './entities/books-review.entity';

@EntityRepository(BooksReview)
export class BooksReviewsRepository extends Repository<BooksReview> {
  async reviewsCount(identifier?: string, username?: string): Promise<number> {
    try {
      const query = this.createQueryBuilder('review');

      if (identifier) {
        query
          .leftJoin('review.book', 'book')
          .where('book.identifier = :identifier', { identifier });
      } else {
        query.where('review.username = :username', { username });
      }

      return await query.getCount();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getReviewsForBook(
    identifier: string,
    skippedItems: number,
    limit: number,
  ): Promise<Array<BooksReview>> {
    try {
      return this.createQueryBuilder('review')
        .leftJoin('review.book', 'book')
        .where('book.identifier = :identifier', { identifier })
        .orderBy('review.createdAt', 'DESC')
        .leftJoinAndSelect('review.user', 'user')
        .offset(skippedItems)
        .limit(limit)
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getReviewsForUser(
    username: string,
    skippedItems: number,
    limit: number,
  ): Promise<Array<BooksReview>> {
    try {
      return this.createQueryBuilder('review')
        .where('review.username = :username', { username })
        .orderBy('review.createdAt', 'DESC')
        .leftJoinAndSelect('review.book', 'book')
        .offset(skippedItems)
        .limit(limit)
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}

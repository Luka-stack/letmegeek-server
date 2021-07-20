import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import ComicsReview from './entities/comics-review.entity';

@EntityRepository(ComicsReview)
export class ComicsReviewsRepository extends Repository<ComicsReview> {
  async reviewsCount(identifier?: string, username?: string): Promise<number> {
    try {
      const query = this.createQueryBuilder('review');

      if (identifier) {
        query
          .leftJoin('review.comic', 'comic')
          .where('comic.identifier = :identifier', { identifier });
      } else {
        query.where('review.username = :username', { username });
      }

      return await query.getCount();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getReviewsForComic(
    identifier: string,
    skippedItems: number,
    limit: number,
  ): Promise<Array<ComicsReview>> {
    try {
      return this.createQueryBuilder('review')
        .leftJoin('review.comic', 'comic')
        .where('comic.identifier = :identifier', { identifier })
        .leftJoinAndSelect('review.user', 'user')
        .orderBy('review.createdAt', 'DESC')
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
  ): Promise<Array<ComicsReview>> {
    try {
      return this.createQueryBuilder('review')
        .where('review.username = :username', { username })
        .leftJoinAndSelect('review.comic', 'comic')
        .orderBy('review.createdAt', 'DESC')
        .offset(skippedItems)
        .limit(limit)
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}

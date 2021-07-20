import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import MangasReview from './entities/mangas-review.entity';

@EntityRepository(MangasReview)
export class MangasReviewsRepository extends Repository<MangasReview> {
  async reviewsCount(identifier?: string, username?: string): Promise<number> {
    try {
      const query = this.createQueryBuilder('review');

      if (identifier) {
        query
          .leftJoin('review.manga', 'manga')
          .where('manga.identifier = :identifier', { identifier });
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
  ): Promise<Array<MangasReview>> {
    try {
      return this.createQueryBuilder('review')
        .leftJoin('review.manga', 'manga')
        .where('manga.identifier = :identifier', { identifier })
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
  ): Promise<Array<MangasReview>> {
    try {
      return this.createQueryBuilder('review')
        .where('review.username = :username', { username })
        .leftJoinAndSelect('review.manga', 'manga')
        .orderBy('review.createdAt', 'DESC')
        .offset(skippedItems)
        .limit(limit)
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}

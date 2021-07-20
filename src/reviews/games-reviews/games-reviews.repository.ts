import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import GamesReview from './entities/games-review.entity';

@EntityRepository(GamesReview)
export class GamesReviewsRepository extends Repository<GamesReview> {
  async reviewsCount(identifier?: string, username?: string): Promise<number> {
    try {
      const query = this.createQueryBuilder('review');

      if (identifier) {
        query
          .leftJoin('review.game', 'game')
          .where('game.identifier = :identifier', { identifier });
      } else {
        query.where('review.username = :username', { username });
      }

      return await query.getCount();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getReviewsForGame(
    identifier: string,
    skippedItems: number,
    limit: number,
  ): Promise<Array<GamesReview>> {
    try {
      return this.createQueryBuilder('review')
        .leftJoin('review.game', 'game')
        .where('game.identifier = :identifier', { identifier })
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
  ): Promise<Array<GamesReview>> {
    try {
      return this.createQueryBuilder('review')
        .where('review.username = :username', { username })
        .leftJoinAndSelect('review.game', 'game')
        .orderBy('review.createdAt', 'DESC')
        .offset(skippedItems)
        .limit(limit)
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}

import { InternalServerErrorException } from '@nestjs/common';
import { DeleteResult, EntityRepository, Repository } from 'typeorm';

import Comment from './entities/comment.entity';

@EntityRepository(Comment)
export class CommentsRepository extends Repository<Comment> {
  async commentsCount(username: string): Promise<number> {
    try {
      return this.createQueryBuilder('comment')
        .where('comment.recipient = :username', {
          username,
        })
        .getCount();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async getCommentsForUser(
    username: string,
    skippedItems: number,
    limit: number,
  ): Promise<Array<Comment>> {
    try {
      return this.createQueryBuilder('comment')
        .where('comment.recipient = :username', { username })
        .orderBy('comment.createdAt', 'DESC')
        .leftJoinAndSelect('comment.authorRef', 'user')
        .offset(skippedItems)
        .limit(limit)
        .getMany();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }

  async deleteUserComment(
    identifier: string,
    username: string,
  ): Promise<DeleteResult> {
    try {
      return this.createQueryBuilder()
        .delete()
        .from(Comment)
        .where('identifier = :identifier', { identifier })
        .andWhere('(author = :username OR recipient = :username)', {
          username,
        })
        .execute();
    } catch (err) {
      throw new InternalServerErrorException();
    }
  }
}

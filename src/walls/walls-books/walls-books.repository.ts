import { InternalServerErrorException } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';

import Book from '../../articles/books/entities/book.entity';
import WallsBook from './entities/walls-book.entity';
import { WallsFilterDto } from '../dto/wall-filter.dto';

@EntityRepository(WallsBook)
export class WallsBooksRepository extends Repository<WallsBook> {
  async getRecords(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsBook>> {
    const { status } = filterDto;
    const query = this.createQueryBuilder('w');

    query.where('LOWER(w.username) = :username', {
      username: `${username.toLowerCase()}`,
    });

    if (status) {
      query.andWhere('LOWER(w.status) = :status', {
        status: `${status.toLowerCase()}`,
      });
    }

    query.innerJoinAndSelect('w.book', 'book');

    try {
      const result = query.getMany();
      return result;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async findUserRecordByBook(
    identifier: string,
    username: string,
  ): Promise<WallsBook> {
    const query = this.createQueryBuilder('wallsBook')
      .innerJoin('wallsBook.book', 'book')
      .where('username = :username', { username })
      .andWhere('book.identifier = :identifier', { identifier });

    try {
      return query.getOne();
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async checkUserHasStatusesOnBook(
    username: string,
    book: Book,
    statuses: Array<string>,
  ): Promise<boolean | undefined> {
    try {
      const recordCount = await this.createQueryBuilder('wallsBook')
        .where('username = :username', { username })
        .andWhere('"bookId" = :book', { book: book.id })
        .andWhere('status IN (:...statuses)', { statuses })
        .limit(1)
        .getCount();

      return recordCount > 0;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}

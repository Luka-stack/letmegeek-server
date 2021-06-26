import { SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import WallsBook from './entities/walls-book.entity';
import { WallsBookDto } from './dto/walls-book.dto';
import { WallArticleStatus } from '../entities/wall-article-status';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { BooksRepository } from '../../books/books.repository';
import { UsersRepository } from '../../users/users.repository';
import { WallsBooksRepository } from './walls-books.repository';
import { UpdateWallsBookDto } from './dto/update-walls-book.dto';

@Injectable()
export class WallsBooksService {
  constructor(
    @InjectRepository(WallsBooksRepository)
    private readonly wallsBooksRepository: WallsBooksRepository,
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,
  ) {}

  async createRecord(
    username: string,
    bookIdentifier: string,
    wallsBookDto: WallsBookDto,
  ): Promise<WallsBook> {
    const user = await this.usersRepository.findOne({ username });
    const book = await this.booksRepository.findOne({
      identifier: bookIdentifier,
    });

    const wallsBook = this.wallsBooksRepository.create({
      user,
      book,
      ...wallsBookDto,
    });

    await this.wallsBooksRepository.save(wallsBook);

    return wallsBook;
  }

  async updateRecord(
    username: string,
    identifier: string,
    updateWallsBookDto: UpdateWallsBookDto,
  ): Promise<WallsBook> {
    const wallsBook = await this.wallsBooksRepository.findOne({
      where: (book: SelectQueryBuilder<WallsBook>) => {
        book
          .where('WallsBook_book.identifier = :identifier', { identifier })
          .andWhere('username = :username', { username });
      },
    });

    if (!wallsBook) {
      throw new NotFoundException('Book not found in users wall');
    }

    wallsBook.updateFields(updateWallsBookDto);
    const response = await this.wallsBooksRepository.save(wallsBook);

    return response;
  }

  async deleteRecord(username: string, identifier: string): Promise<void> {
    const wallsBook = await this.wallsBooksRepository.findOne({
      where: (book: SelectQueryBuilder<WallsBook>) => {
        book
          .where('WallsBook_book.identifier = :identifier', { identifier })
          .andWhere('username = :username', { username });
      },
    });

    if (!wallsBook) {
      throw new NotFoundException('Book not found in users wall');
    }

    await this.wallsBooksRepository.delete({ id: wallsBook.id });
  }

  getRecordsByUser(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsBook>> {
    return this.wallsBooksRepository.getRecords(username, filterDto);
  }
}

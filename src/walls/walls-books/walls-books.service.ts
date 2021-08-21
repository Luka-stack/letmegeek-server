import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import User from '../../users/entities/user.entity';
import WallsBook from './entities/walls-book.entity';
import { WallsBookDto } from './dto/walls-book.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { BooksRepository } from '../../articles/books/books.repository';
import { WallsBooksRepository } from './walls-books.repository';
import { UpdateWallsBookDto } from './dto/update-walls-book.dto';

@Injectable()
export class WallsBooksService {
  constructor(
    @InjectRepository(WallsBooksRepository)
    private readonly wallsBooksRepository: WallsBooksRepository,
    @InjectRepository(BooksRepository)
    private readonly booksRepository: BooksRepository,
  ) {}

  async createRecord(
    bookIdentifier: string,
    wallsBookDto: WallsBookDto,
    user: User,
  ): Promise<WallsBook> {
    const book = await this.booksRepository.findOne({
      identifier: bookIdentifier,
    });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    await this.wallsBooksRepository
      .findOne({
        username: user.username,
        book,
      })
      .then((result) => {
        if (result) {
          throw new ConflictException('Book already exists in users wall');
        }
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
    identifier: string,
    updateWallsBookDto: UpdateWallsBookDto,
    user: User,
  ): Promise<WallsBook> {
    const wallsBook = await this.wallsBooksRepository.findUserRecordByBook(
      identifier,
      user.username,
    );

    if (!wallsBook) {
      throw new NotFoundException('Book not found in users wall');
    }

    wallsBook.updateFields(updateWallsBookDto);
    const response = await this.wallsBooksRepository.save(wallsBook);

    return response;
  }

  async deleteRecord(identifier: string, user: User): Promise<void> {
    const wallsBook = await this.wallsBooksRepository.findUserRecordByBook(
      identifier,
      user.username,
    );

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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import WallsComic from './entities/walls-comic.entity';
import { WallsComicDto } from './dto/walls-comic.dto';
import { WallArticleStatus } from '../entities/wall-article-status';
import { UsersRepository } from '../../users/users.repository';
import { ComicsRepository } from '../../comics/comics.repository';
import { UpdateWallsComicDto } from './dto/update-walls-comic.dto';
import { WallsComicsRepository } from './walls-comics.repository';
import { SelectQueryBuilder } from 'typeorm';
import { WallsFilterDto } from '../dto/wall-filter.dto';

@Injectable()
export class WallsComicsService {
  constructor(
    @InjectRepository(WallsComicsRepository)
    private readonly wallsComicsRepository: WallsComicsRepository,
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
    @InjectRepository(ComicsRepository)
    private readonly comicsRepository: ComicsRepository,
  ) {}

  async createRecord(
    username: string,
    comicIdentifier: string,
    wallsComicDto: WallsComicDto,
  ): Promise<WallsComic> {
    const user = await this.usersRepository.findOne({ username });
    const comic = await this.comicsRepository.findOne({
      identifier: comicIdentifier,
    });

    const wallsBook = this.wallsComicsRepository.create({
      user,
      comic,
      status: WallArticleStatus.COMPLETED,
      issues: wallsComicDto.issues,
    });
    await this.wallsComicsRepository.save(wallsBook);

    return wallsBook;
  }

  async updateRecord(
    username: string,
    identifier: string,
    updateWallsComicDto: UpdateWallsComicDto,
  ): Promise<WallsComic> {
    const wallsComic = await this.wallsComicsRepository.findOne({
      where: (comic: SelectQueryBuilder<WallsComic>) => {
        comic
          .where('WallsComic_comic.identifier = :identifier', { identifier })
          .where('username = :username', { username });
      },
    });

    if (!wallsComic) {
      throw new NotFoundException('Comic not found in users wall');
    }

    wallsComic.updateFields(updateWallsComicDto);
    const response = await this.wallsComicsRepository.save(wallsComic);

    return response;
  }

  async deleteRecord(username: string, identifier: string): Promise<void> {
    const wallsComic = await this.wallsComicsRepository.findOne({
      where: (comic: SelectQueryBuilder<WallsComic>) => {
        comic
          .where('WallsComic_comic.identifier = :identifier', { identifier })
          .where('username = :username', { username });
      },
    });

    if (!wallsComic) {
      throw new NotFoundException('Comic not found in users wall');
    }

    await this.wallsComicsRepository.delete({ id: wallsComic.id });
  }

  getRecordsByUser(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsComic>> {
    return this.wallsComicsRepository.getRecords(username, filterDto);
  }
}

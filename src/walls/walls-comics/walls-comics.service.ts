import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Comic from '../../comics/entities/comic.entity';
import User from '../../users/entities/user.entity';
import WallsComic from './entities/walls-comic.entity';
import { WallsComicDto } from './dto/walls-comic.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { UpdateWallsComicDto } from './dto/update-walls-comic.dto';
import { ComicsRepository } from '../../comics/comics.repository';
import { WallsComicsRepository } from './walls-comics.repository';
import {
  allWallArticleStatusesModes,
  WallArticleStatus,
} from '../entities/wall-article-status';

@Injectable()
export class WallsComicsService {
  constructor(
    @InjectRepository(WallsComicsRepository)
    private readonly wallsComicsRepository: WallsComicsRepository,
    @InjectRepository(ComicsRepository)
    private readonly comicsRepository: ComicsRepository,
  ) {}

  async createRecord(
    comicIdentifier: string,
    wallsComicDto: WallsComicDto,
    user: User,
  ): Promise<WallsComic> {
    const comic = await this.comicsRepository
      .findOne({
        identifier: comicIdentifier,
      })
      .then((result: Comic) => {
        if (!result) {
          throw new NotFoundException('Comic book not found');
        }

        return result;
      });

    await this.wallsComicsRepository
      .findOne({
        username: user.username,
        comic,
      })
      .then((result) => {
        if (result) {
          throw new ConflictException(
            'Comic book already exists in users wall',
          );
        }
      });

    const wallsComic = this.wallsComicsRepository.create({
      user,
      comic,
      ...wallsComicDto,
    });
    await this.wallsComicsRepository.save(wallsComic);

    return wallsComic;
  }

  async updateRecord(
    identifier: string,
    updateWallsComicDto: UpdateWallsComicDto,
    user: User,
  ): Promise<WallsComic> {
    const wallsComic = await this.wallsComicsRepository.findUserRecordByComic(
      identifier,
      user.username,
    );

    if (!wallsComic) {
      throw new NotFoundException('Comic book not found in users wall');
    }

    wallsComic.updateFields(updateWallsComicDto);
    const response = await this.wallsComicsRepository.save(wallsComic);

    return response;
  }

  async deleteRecord(identifier: string, user: User): Promise<void> {
    const wallsComic = await this.wallsComicsRepository.findUserRecordByComic(
      identifier,
      user.username,
    );

    if (!wallsComic) {
      throw new NotFoundException('Comic book not found in users wall');
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

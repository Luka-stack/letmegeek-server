import { InjectRepository } from '@nestjs/typeorm';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import Manga from '../../articles/mangas/entities/manga.entity';
import User from '../../users/entities/user.entity';
import WallsManga from './entities/walls-manga.entity';
import { WallsMangaDto } from './dto/walls-manga.dto';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { UpdateWallsMangaDto } from './dto/update-walls-manga.dto';
import { MangasRepository } from '../../articles/mangas/mangas.repository';
import { WallsMangasRepository } from './walls-mangas.repository';

@Injectable()
export class WallsMangasService {
  constructor(
    @InjectRepository(WallsMangasRepository)
    private readonly wallsMangasRepository: WallsMangasRepository,
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
  ) {}

  async createRecord(
    mangaIdentifier: string,
    wallsMangaDto: WallsMangaDto,
    user: User,
  ): Promise<WallsManga> {
    const manga = await this.mangasRepository
      .findOne({
        identifier: mangaIdentifier,
      })
      .then((result: Manga) => {
        if (!result) {
          throw new NotFoundException('Manga not found');
        }

        return result;
      });

    await this.wallsMangasRepository
      .findOne({ username: user.username, manga })
      .then((result: WallsManga) => {
        if (result) {
          throw new ConflictException('Manga already exists in users wall');
        }
      });

    const wallsManga = this.wallsMangasRepository.create({
      user,
      manga,
      ...wallsMangaDto,
    });

    await this.wallsMangasRepository.save(wallsManga);

    return wallsManga;
  }

  async updateRecord(
    identifier: string,
    updateWallsMangaDto: UpdateWallsMangaDto,
    user: User,
  ): Promise<WallsManga> {
    const wallsManga = await this.wallsMangasRepository.findUserRecordByManga(
      identifier,
      user.username,
    );

    if (!wallsManga) {
      throw new NotFoundException('Manga not found in users wall');
    }

    wallsManga.updateFields(updateWallsMangaDto);
    const response = await this.wallsMangasRepository.save(wallsManga);

    return response;
  }

  async deleteRecord(identifier: string, user: User): Promise<void> {
    const wallsManga = await this.wallsMangasRepository.findUserRecordByManga(
      identifier,
      user.username,
    );

    if (!wallsManga) {
      throw new NotFoundException('Manga not found in users wall');
    }

    await this.wallsMangasRepository.delete({ id: wallsManga.id });
  }

  getRecordsByUser(
    username: string,
    filterDto: WallsFilterDto,
  ): Promise<Array<WallsManga>> {
    return this.wallsMangasRepository.getRecords(username, filterDto);
  }
}

import { SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import WallsManga from './entities/walls-manga.entity';
import { WallsMangaDto } from './dto/walls-manga.dto';
import { WallArticleStatus } from '../entities/wall-article-status';
import { WallsFilterDto } from '../dto/wall-filter.dto';
import { UsersRepository } from '../../users/users.repository';
import { MangasRepository } from '../../mangas/mangas.repository';
import { UpdateWallsMangaDto } from './dto/update-walls-manga.dto';
import { WallsMangasRepository } from './walls-mangas.repository';

@Injectable()
export class WallsMangasService {
  constructor(
    @InjectRepository(WallsMangasRepository)
    private readonly wallsMangasRepository: WallsMangasRepository,
    @InjectRepository(UsersRepository)
    private readonly usersRepository: UsersRepository,
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
  ) {}

  async createRecord(
    username: string,
    mangaIdentifier: string,
    wallsMangaDto: WallsMangaDto,
  ): Promise<WallsManga> {
    const user = await this.usersRepository.findOne({ username });
    const manga = await this.mangasRepository.findOne({
      identifier: mangaIdentifier,
    });

    const wallsManga = this.wallsMangasRepository.create({
      user,
      manga,
      status: WallArticleStatus.COMPLETED,
      chapters: wallsMangaDto.chapters,
      volumes: wallsMangaDto.volumes,
    });

    await this.wallsMangasRepository.save(wallsManga);

    return wallsManga;
  }

  async updateRecord(
    username: string,
    identifier: string,
    updateWallsMangaDto: UpdateWallsMangaDto,
  ): Promise<WallsManga> {
    const wallsManga = await this.wallsMangasRepository.findOne({
      where: (book: SelectQueryBuilder<WallsManga>) => {
        book
          .where('WallsManga_manga.identifier = :identifier', { identifier })
          .andWhere('username = :username', { username });
      },
    });

    if (!wallsManga) {
      throw new NotFoundException('Manga not found in users wall');
    }

    wallsManga.updateFields(updateWallsMangaDto);
    const response = await this.wallsMangasRepository.save(wallsManga);

    return response;
  }

  async deleteRecord(username: string, identifier: string): Promise<void> {
    const wallsManga = await this.wallsMangasRepository.findOne({
      where: (book: SelectQueryBuilder<WallsManga>) => {
        book
          .where('WallsManga_manga.identifier = :identifier', { identifier })
          .andWhere('username = :username', { username });
      },
    });

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

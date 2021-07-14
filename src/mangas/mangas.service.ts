import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';

import User from '../users/entities/user.entity';
import Manga from './entities/manga.entity';
import { UserRole } from '../auth/entities/user-role';
import { MangaDto } from './dto/manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { MangasFilterDto } from './dto/mangas-filter.dto';
import { MangasRepository } from './mangas.repository';
import { removeSpacesFromCommaSeparatedString } from '../utils/helpers';

@Injectable()
export class MangasService {
  constructor(
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
  ) {}

  async createManga(mangaDto: MangaDto, user: User): Promise<Manga> {
    if (user.role === UserRole.USER) {
      mangaDto.draft = true;
    }

    if (mangaDto.authors) {
      mangaDto.authors = removeSpacesFromCommaSeparatedString(mangaDto.authors);
    }

    if (mangaDto.publishers) {
      mangaDto.publishers = removeSpacesFromCommaSeparatedString(
        mangaDto.publishers,
      );
    }

    if (mangaDto.genres) {
      mangaDto.genres = removeSpacesFromCommaSeparatedString(mangaDto.genres);
    }

    const manga = this.mangasRepository.create(mangaDto);
    manga.createdAt = new Date();

    await this.mangasRepository.save(manga).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return manga;
  }

  getMangas(filterDto: MangasFilterDto, user: User): Promise<Array<Manga>> {
    return this.mangasRepository
      .getMangas(filterDto)
      .then((result: Array<Manga>) => {
        if (result) {
          result.map((manga: Manga) => {
            const wall = manga.wallsMangas.find(
              (wall) => wall.username === user.username,
            );
            manga.userWallsManga = wall;
          });
        }

        return result;
      });
  }

  getOneManga(identifier: string, slug: string, user: User): Promise<Manga> {
    return this.mangasRepository
      .getCompleteManga(identifier, slug, user)
      .then((result: Manga) => {
        if (!result) {
          throw new NotFoundException('Manga not found');
        }

        if (user) {
          const wall = result.wallsMangas.find(
            (wall) => wall.username === user.username,
          );
          result.userWallsManga = wall;
        }

        return result;
      });
  }

  async updateManga(
    identifier: string,
    slug: string,
    updateMangaDto: UpdateMangaDto,
  ): Promise<Manga> {
    const manga = await this.mangasRepository.findOne({ identifier, slug });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    if (updateMangaDto.authors) {
      updateMangaDto.authors = removeSpacesFromCommaSeparatedString(
        updateMangaDto.authors,
      );
    }

    if (updateMangaDto.publishers) {
      updateMangaDto.publishers = removeSpacesFromCommaSeparatedString(
        updateMangaDto.publishers,
      );
    }

    if (updateMangaDto.genres) {
      updateMangaDto.genres = removeSpacesFromCommaSeparatedString(
        updateMangaDto.genres,
      );
    }

    manga.mapDtoToEntity(updateMangaDto);
    if (updateMangaDto.draft != null && updateMangaDto.draft) {
      manga.createdAt = new Date();
    }

    await this.mangasRepository.save(manga).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return manga;
  }

  async deleteManga(identifier: string, slug): Promise<void> {
    const result = await this.mangasRepository.delete({ identifier, slug });

    if (result.affected === 0) {
      throw new NotFoundException('Manga not found');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
    identifier: string,
    slug: string,
  ): Promise<Manga> {
    const manga = await this.mangasRepository.findOne({ identifier, slug });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    const oldImage = manga.imageUrn || '';
    manga.imageUrn = file.filename;

    await this.mangasRepository.save(manga);

    if (oldImage !== '') {
      fs.unlinkSync(`public\\images\\${oldImage}`);
    }

    return manga;
  }
}

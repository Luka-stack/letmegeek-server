import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import Manga from './entities/manga.entity';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { MangasRepository } from './mangas.repository';
import { MangaDto } from './dto/manga.dto';
import { MangasFilterDto } from './dto/mangas-filter.dto';

@Injectable()
export class MangasService {
  constructor(
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
  ) {}

  async createManga(mangaDto: MangaDto): Promise<Manga> {
    const manga = this.mangasRepository.create(mangaDto);
    manga.createdAt = new Date();

    await this.mangasRepository.save(manga).catch((err) => {
      if (err.code == 23505) {
        throw new ConflictException('Title has to be unique');
      }
    });

    return manga;
  }

  getMangas(filterDto: MangasFilterDto): Promise<Array<Manga>> {
    return this.mangasRepository.getMangas(filterDto);
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
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMangaDto } from './dto/create-manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';
import Manga from './entities/manga.entity';
import { MangasRepository } from './mangas.repository';

@Injectable()
export class MangasService {
  constructor(
    @InjectRepository(MangasRepository)
    private readonly mangasRepository: MangasRepository,
  ) {}

  createManga(createMangaDto: CreateMangaDto): Promise<Manga> {
    return this.mangasRepository.createManga(createMangaDto);
  }

  async getMangas(): Promise<Array<Manga>> {
    return await this.mangasRepository.find();
  }

  async updateManga(
    identifier: string,
    updateMangaDto: UpdateMangaDto,
  ): Promise<Manga> {
    const manga = await this.mangasRepository.findOne({ identifier });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    manga.title = updateMangaDto.title || manga.title;
    manga.author = updateMangaDto.author || manga.author;
    manga.description = updateMangaDto.description || manga.description;
    manga.publisher = updateMangaDto.publisher || manga.publisher;
    manga.premiered = updateMangaDto.premiered || manga.premiered;
    manga.draft = updateMangaDto.draft || manga.draft;

    await this.mangasRepository.save(manga);
    return manga;
  }

  async deleteManga(identifier: string): Promise<void> {
    const result = await this.mangasRepository.delete({ identifier });

    if (result.affected === 0) {
      throw new NotFoundException('Manga not found');
    }
  }
}

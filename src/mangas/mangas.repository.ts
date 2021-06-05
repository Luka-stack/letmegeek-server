import { EntityRepository, Repository } from 'typeorm';
import { CreateMangaDto } from './dto/create-manga.dto';

import Manga from './entities/manga.entity';

@EntityRepository(Manga)
export class MangasRepository extends Repository<Manga> {
  async createManga(createMangaDto: CreateMangaDto): Promise<Manga> {
    const manga = this.create({
      title: createMangaDto.title,
      author: createMangaDto.author,
      description: createMangaDto.description,
      publisher: createMangaDto.publisher,
      premiered: createMangaDto.premiered,
      draft: createMangaDto.draft,
    });

    await this.save(manga);
    return manga;
  }
}
